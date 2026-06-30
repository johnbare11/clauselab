import { Wallet } from "xrpl"
import type { EscrowExpect, LiveArtifacts } from "./escrow"

// Live XRPL Testnet execution, gated behind XRPL_LIVE_GRADING. Uses the public
// faucet + JSON-RPC over HTTPS (the same egress path the rest of the app uses),
// and xrpl.js purely offline for wallet generation and signing. Every failure
// degrades to { available: false } so grading falls back to structural checks -
// a faucet hiccup can never break a submission.

const RPC = process.env.XRPL_TESTNET_RPC || "https://s.altnet.rippletest.net:51234"
const FAUCET = process.env.XRPL_TESTNET_FAUCET || "https://faucet.altnet.rippletest.net/accounts"
const EXPLORER = "https://testnet.xrpl.org/transactions/"

export function liveGradingEnabled(): boolean {
  return process.env.XRPL_LIVE_GRADING === "1" || process.env.XRPL_LIVE_GRADING === "true"
}

async function rpc(method: string, params: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params: [params] }),
    })
    const data = await res.json()
    return (data?.result as Record<string, unknown>) ?? null
  } catch {
    return null
  }
}

async function fundWallet(): Promise<Wallet | null> {
  try {
    const res = await fetch(FAUCET, { method: "POST" })
    const data = await res.json()
    const secret = data?.account?.secret || data?.seed
    if (!secret) return null
    return Wallet.fromSeed(secret)
  } catch {
    return null
  }
}

async function signAndSubmit(wallet: Wallet, tx: Record<string, unknown>): Promise<{ result?: string; hash?: string; sequence?: number }> {
  const info = await rpc("account_info", { account: wallet.classicAddress, ledger_index: "current" })
  const seq = (info?.account_data as Record<string, unknown> | undefined)?.Sequence
  if (typeof seq !== "number") return {}
  const current = await rpc("ledger_current", {})
  const ledgerIndex = (current?.ledger_current_index as number) || 0

  const prepared = {
    ...tx,
    Account: wallet.classicAddress,
    Sequence: seq,
    Fee: "12",
    LastLedgerSequence: ledgerIndex + 20,
  }
  try {
    const signed = wallet.sign(prepared as Parameters<Wallet["sign"]>[0])
    const submitRes = await rpc("submit", { tx_blob: signed.tx_blob })
    return {
      result: submitRes?.engine_result as string | undefined,
      hash: signed.hash,
      sequence: seq,
    }
  } catch {
    return {}
  }
}

// `submit` only queues a transaction; it takes a few seconds for a ledger to
// close and validate it. We poll the `tx` command until the transaction is
// validated - this is exactly the state the public explorer needs, so once it
// returns true the EscrowCreate has been applied (its escrow object exists, so
// the EscrowFinish can be evaluated) and the explorer link will resolve.
async function waitForValidation(hash: string | undefined, maxTries = 10, delayMs = 1500): Promise<boolean> {
  if (!hash) return false
  for (let i = 0; i < maxTries; i++) {
    const res = await rpc("tx", { transaction: hash })
    if (res?.validated === true) return true
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return false
}

// The on-ledger run is a proof of execution, not a value transfer: a fresh
// faucet wallet only holds a limited balance, so escrowing the candidate's full
// amount (e.g. 100 XRP) fails to apply with tecUNFUNDED. The candidate's real
// Amount is already validated structurally by the valuePreserved check, so for
// the live submission we lock a small, always-affordable amount instead.
const LIVE_ESCROW_DROPS = process.env.XRPL_LIVE_ESCROW_DROPS || "1000000" // 1 XRP

// Submits the candidate's EscrowCreate, then attempts an immediate EscrowFinish
// to prove the dispute window is enforced by the protocol.
export async function runEscrowLive(createTx: Record<string, unknown>, _expect: EscrowExpect): Promise<LiveArtifacts> {
  const base: LiveArtifacts = { attempted: true, available: false }
  const wallet = await fundWallet()
  if (!wallet) return { ...base, note: "Testnet faucet was unavailable; graded on executed transaction structure." }

  const create = await signAndSubmit(wallet, { ...createTx, Amount: LIVE_ESCROW_DROPS, Account: wallet.classicAddress })
  if (!create.result) return { ...base, note: "Testnet submission was unavailable; graded on executed transaction structure." }

  // The EscrowFinish references the create by its OfferSequence, which is the
  // Sequence the EscrowCreate was submitted with. We only attempt the finish
  // once the create has validated and the escrow object exists on-ledger -
  // otherwise the finish would fail for the wrong reason (no target yet) rather
  // than the one that matters: the dispute window blocking an early release.
  let finish: { result?: string; hash?: string } = {}
  let createValidated = false
  if (create.result.startsWith("tes") && create.sequence !== undefined) {
    createValidated = await waitForValidation(create.hash)
    if (createValidated) {
      finish = await signAndSubmit(wallet, {
        TransactionType: "EscrowFinish",
        Owner: wallet.classicAddress,
        OfferSequence: create.sequence,
      })
    }
  }

  return {
    attempted: true,
    available: true,
    createHash: create.hash,
    createResult: create.result,
    createValidated,
    finishHash: finish.hash,
    finishResult: finish.result,
    // Only link to the explorer once the create is validated on-ledger - an
    // unvalidated hash shows "Something bad happened" on the explorer.
    explorer: createValidated && create.hash ? EXPLORER + create.hash : undefined,
  }
}
