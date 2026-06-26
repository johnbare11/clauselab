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

async function signAndSubmit(wallet: Wallet, tx: Record<string, unknown>): Promise<{ result?: string; hash?: string }> {
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
    }
  } catch {
    return {}
  }
}

// Submits the candidate's EscrowCreate, then attempts an immediate EscrowFinish
// to prove the dispute window is enforced by the protocol.
export async function runEscrowLive(createTx: Record<string, unknown>, _expect: EscrowExpect): Promise<LiveArtifacts> {
  const base: LiveArtifacts = { attempted: true, available: false }
  const wallet = await fundWallet()
  if (!wallet) return { ...base, note: "Testnet faucet was unavailable; graded on executed transaction structure." }

  const create = await signAndSubmit(wallet, { ...createTx, Account: wallet.classicAddress })
  if (!create.result) return { ...base, note: "Testnet submission was unavailable; graded on executed transaction structure." }

  // OfferSequence for the finish is the create's account Sequence.
  const info = await rpc("account_info", { account: wallet.classicAddress, ledger_index: "current" })
  const seqAfter = (info?.account_data as Record<string, unknown> | undefined)?.Sequence
  const offerSequence = typeof seqAfter === "number" ? seqAfter - 1 : undefined

  let finish: { result?: string; hash?: string } = {}
  if (offerSequence !== undefined && create.result.startsWith("tes")) {
    finish = await signAndSubmit(wallet, {
      TransactionType: "EscrowFinish",
      Owner: wallet.classicAddress,
      OfferSequence: offerSequence,
    })
  }

  return {
    attempted: true,
    available: true,
    createHash: create.hash,
    createResult: create.result,
    finishHash: finish.hash,
    finishResult: finish.result,
    explorer: create.hash ? EXPLORER + create.hash : undefined,
  }
}
