import { Wallet } from "xrpl"
import type { EscrowExpect, LiveArtifacts } from "./escrow"

// Live XRPL Testnet execution, gated behind XRPL_LIVE_GRADING. Uses the public
// faucet + JSON-RPC over HTTPS (the same egress path the rest of the app uses),
// and xrpl.js purely offline for wallet generation and signing. Every failure
// degrades to { available: false } so grading falls back to structural checks -
// a faucet hiccup can never break a submission.

const RPC = process.env.XRPL_TESTNET_RPC || "https://s.altnet.rippletest.net:51234"
const FAUCET = process.env.XRPL_TESTNET_FAUCET || "https://faucet.altnet.rippletest.net/accounts"
// Bithomp's testnet explorer indexes far faster and more reliably than Ripple's
// own testnet.xrpl.org, which reads from a laggy backend and often 404s a
// just-validated transaction. Overridable in case we want to switch explorers.
const EXPLORER = process.env.XRPL_TESTNET_EXPLORER || "https://test.bithomp.com/explorer/"

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
// close and validate it. We track two distinct states:
//   applied   - the create is on-ledger (its escrow object exists), so the
//               EscrowFinish can be meaningfully evaluated.
//   validated - the `tx` query itself reports validated. This is the exact
//               data source the public explorer reads, so we only ever build an
//               explorer link once this is true - otherwise the link 404s with
//               "Something bad happened" for anyone who clicks immediately.
// The public Testnet endpoint is a load-balanced cluster where a `tx` lookup can
// briefly miss a freshly-validated transaction, so `applied` (via the escrow
// object) is the more reliable signal for gating the finish.
// Is the EscrowCreate validated on-ledger? Two signals: the `tx` query reporting
// validated (gives us the ledger index), or the escrow object existing on a
// *validated* ledger (account_objects with ledger_index "validated" only returns
// validated state). The escrow-object check is the reliable one - the public
// endpoint is a load-balanced cluster where a `tx` lookup can briefly miss a
// just-validated transaction, but if the escrow object is there, the create is
// definitively validated. Either signal means the explorer will resolve it.
export async function createStatus(hash: string | undefined, account: string | undefined): Promise<{ validated: boolean; ledgerIndex?: number }> {
  if (hash) {
    const tx = await rpc("tx", { transaction: hash })
    if (tx?.validated === true) {
      return { validated: true, ledgerIndex: typeof tx.ledger_index === "number" ? tx.ledger_index : undefined }
    }
  }
  if (account) {
    const objs = await rpc("account_objects", { account, type: "escrow", ledger_index: "validated" })
    const list = objs?.account_objects as unknown[] | undefined
    if (Array.isArray(list) && list.length > 0) return { validated: true }
  }
  return { validated: false }
}

interface ConfirmState { validated: boolean; ledgerIndex?: number }
async function confirmCreate(account: string, hash: string | undefined, maxTries = 8, delayMs = 1500): Promise<ConfirmState> {
  for (let i = 0; i < maxTries; i++) {
    const s = await createStatus(hash, account)
    if (s.validated) return s
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return { validated: false }
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
  const createOk = create.result.startsWith("tes")
  let finish: { result?: string; hash?: string } = {}
  let confirm: ConfirmState = { validated: false }
  if (createOk && create.sequence !== undefined) {
    // Wait until the create is validated on-ledger before attempting the finish,
    // otherwise the finish fails for the wrong reason (no escrow yet) instead of
    // the one that matters: the dispute window blocking an early release.
    confirm = await confirmCreate(wallet.classicAddress, create.hash)
    if (confirm.validated) {
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
    createAccount: wallet.classicAddress,
    createResult: create.result,
    createValidated: confirm.validated,
    createLedgerIndex: confirm.ledgerIndex,
    finishHash: finish.hash,
    finishResult: finish.result,
    // Always hand the client the explorer URL when the create was accepted. The
    // client only reveals it as a clickable link once it has confirmed (via
    // txStatus polling) that the tx is validated and therefore explorer-ready,
    // showing a "link appearing shortly" state until then.
    explorer: createOk && create.hash ? EXPLORER + create.hash : undefined,
  }
}
