import { Client, Wallet } from "xrpl"
import type { EscrowExpect, LiveArtifacts } from "./escrow"

// Live XRPL Testnet execution, gated behind XRPL_LIVE_GRADING. Uses the official
// xrpl.js Client over WebSocket with submitAndWait - the library's reliable
// submission path (autofill, re-broadcast, wait for validation) - so a result is
// only ever reported once the ledger has actually validated the transaction.
// Every failure degrades to { available: false } so grading falls back to
// structural checks - a faucet or network hiccup can never break a submission.

// Candidate WebSocket endpoints, tried in order. xrpl-labs runs on 443, which
// gets through egress rules that block non-standard ports like 51233.
const WSS_ENDPOINTS = process.env.XRPL_TESTNET_WSS
  ? [process.env.XRPL_TESTNET_WSS]
  : [
      "wss://s.altnet.rippletest.net:51233",
      "wss://testnet.xrpl-labs.com",
      "wss://clio.altnet.rippletest.net:51233",
    ]
const RPC = process.env.XRPL_TESTNET_RPC || "https://s.altnet.rippletest.net:51234"
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

// Safety-net status check used by /api/xrpl/tx-status. With submitAndWait the
// result normally arrives already validated, but if the server ever reports a
// created-but-unconfirmed tx, the client polls this until it can safely reveal
// the explorer link. Two signals: the `tx` query reporting validated, or the
// escrow object existing on a *validated* ledger (account_objects with
// ledger_index "validated" only returns validated state).
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

// The on-ledger run is a proof of execution, not a value transfer: a fresh
// faucet wallet only holds a limited balance, so escrowing the candidate's full
// amount (e.g. 100 XRP) fails to apply with tecUNFUNDED. The candidate's real
// Amount is already validated structurally by the valuePreserved check, so for
// the live submission we lock a small, always-affordable amount instead.
const LIVE_ESCROW_DROPS = process.env.XRPL_LIVE_ESCROW_DROPS || "1000000" // 1 XRP

function metaResult(meta: unknown): string | undefined {
  if (meta && typeof meta === "object" && "TransactionResult" in meta) {
    const r = (meta as { TransactionResult?: unknown }).TransactionResult
    return typeof r === "string" ? r : undefined
  }
  return undefined
}

// Submits the candidate's EscrowCreate and waits for it to validate, then
// attempts an immediate EscrowFinish to prove the dispute window is enforced by
// the protocol. tec results (like the expected tecNO_PERMISSION on the finish)
// are validated into the ledger too, so submitAndWait resolves for them.
export async function runEscrowLive(createTx: Record<string, unknown>, _expect: EscrowExpect): Promise<LiveArtifacts> {
  const base: LiveArtifacts = { attempted: true, available: false }

  let client: Client | null = null
  for (const url of WSS_ENDPOINTS) {
    const candidate = new Client(url, { connectionTimeout: 10000 })
    try {
      await candidate.connect()
      client = candidate
      break
    } catch (e) {
      // Surfaces in Railway logs so a connect failure is diagnosable.
      console.error(`XRPL connect failed for ${url}:`, e instanceof Error ? e.message : e)
      try { await candidate.disconnect() } catch { /* never connected */ }
    }
  }
  if (!client) {
    return { ...base, note: "Testnet was unreachable; graded on executed transaction structure." }
  }

  try {
    let wallet: Wallet
    try {
      // client.fundWallet() waits until the faucet's funding payment has
      // actually landed, so the account exists before we submit from it.
      const funded = await client.fundWallet()
      wallet = funded.wallet
    } catch {
      return { ...base, note: "Testnet faucet was unavailable; graded on executed transaction structure." }
    }

    // Autofill separately so we know the exact Sequence the create used - the
    // EscrowFinish references the create by that Sequence (OfferSequence).
    let createHash: string | undefined
    let createResult: string | undefined
    let createLedgerIndex: number | undefined
    let createSequence: number | undefined
    try {
      const prepared = await client.autofill({
        ...createTx,
        Account: wallet.classicAddress,
        Amount: LIVE_ESCROW_DROPS,
      } as Parameters<Client["autofill"]>[0])
      createSequence = (prepared as { Sequence?: number }).Sequence
      const res = await client.submitAndWait(prepared, { wallet })
      createHash = res.result.hash
      createLedgerIndex = res.result.ledger_index
      createResult = metaResult(res.result.meta)
    } catch {
      return { ...base, note: "Testnet submission did not validate in time; graded on executed transaction structure." }
    }

    let finishHash: string | undefined
    let finishResult: string | undefined
    if (createResult === "tesSUCCESS" && createSequence !== undefined) {
      try {
        const finishPrepared = await client.autofill({
          TransactionType: "EscrowFinish",
          Account: wallet.classicAddress,
          Owner: wallet.classicAddress,
          OfferSequence: createSequence,
        } as Parameters<Client["autofill"]>[0])
        const fres = await client.submitAndWait(finishPrepared, { wallet })
        finishHash = fres.result.hash
        finishResult = metaResult(fres.result.meta)
      } catch (e) {
        // A finish rejected pre-flight (tem/tef) never validates and throws;
        // surface the engine result when the error message carries it.
        const msg = e instanceof Error ? e.message : ""
        const m = msg.match(/\b(te[cfmlr][A-Z_]+)\b/)
        if (m) finishResult = m[1]
      }
    }

    return {
      attempted: true,
      available: true,
      createHash,
      createAccount: wallet.classicAddress,
      createResult,
      // submitAndWait only resolves once the transaction is validated, so the
      // explorer link is guaranteed to show a validated transaction.
      createValidated: createResult !== undefined,
      createLedgerIndex,
      finishHash,
      finishResult,
      explorer: createHash && createResult ? EXPLORER + createHash : undefined,
    }
  } finally {
    try { await client.disconnect() } catch { /* already closed */ }
  }
}
