// Escrow challenge harness: structural assertions on the XRPL transaction the
// candidate's code actually produced, plus an optional live Testnet submission
// that proves the ledger accepts the valid path and rejects a premature release.

export interface EscrowExpect {
  destination: string
  amountXrp: number
  finishAfterSeconds: number // legal dispute window, e.g. 48h
  cancelAfterSeconds: number // legal expiry/refund window, e.g. 30d
  toleranceSeconds: number
}

export interface CheckOutcome {
  passed: boolean
  feedback: string
}

export interface LiveArtifacts {
  attempted: boolean
  available: boolean
  createHash?: string
  createAccount?: string
  createResult?: string
  createValidated?: boolean
  createLedgerIndex?: number
  finishHash?: string
  finishResult?: string
  explorer?: string
  note?: string
}

type Tx = Record<string, unknown>

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v)
  return null
}

// Each check inspects the produced transaction (and live artifacts when present)
// for one legal requirement. `now` is the Ripple-epoch second the candidate code
// was run with, so window assertions are relative to the same clock.
export function runCheck(
  checkId: string,
  tx: Tx | null,
  expect: EscrowExpect,
  now: number,
  live: LiveArtifacts,
): CheckOutcome {
  if (!tx || typeof tx !== "object") {
    return { passed: false, feedback: "Your code did not return an EscrowCreate transaction object." }
  }

  const finishAfter = num(tx.FinishAfter)
  const cancelAfter = num(tx.CancelAfter)
  const tol = expect.toleranceSeconds
  const expFinish = now + expect.finishAfterSeconds
  const expCancel = now + expect.cancelAfterSeconds

  switch (checkId) {
    case "createWellFormed": {
      const okType = tx.TransactionType === "EscrowCreate"
      const okAmount = tx.Amount !== undefined && tx.Amount !== null && tx.Amount !== ""
      const okDest = typeof tx.Destination === "string" && tx.Destination.length > 0
      const passed = okType && okAmount && okDest
      if (!passed) {
        const miss = [!okType && "TransactionType must be EscrowCreate", !okAmount && "Amount is missing", !okDest && "Destination is missing"].filter(Boolean).join("; ")
        return { passed, feedback: `EscrowCreate is not well-formed: ${miss}.` }
      }
      if (live.available && live.createResult) {
        const ok = live.createResult.startsWith("tes")
        return { passed: ok, feedback: ok
          ? `Accepted by XRPL Testnet (${live.createResult}).`
          : `Ledger rejected EscrowCreate (${live.createResult}).` }
      }
      return { passed: true, feedback: "EscrowCreate is well-formed." }
    }

    case "disputeWindow": {
      if (finishAfter === null) {
        return { passed: false, feedback: "No FinishAfter set - funds could be released immediately, with no 48-hour dispute window." }
      }
      const passed = Math.abs(finishAfter - expFinish) <= tol
      return { passed, feedback: passed
        ? "FinishAfter encodes the 48-hour dispute window."
        : `FinishAfter does not match the required 48-hour dispute window (off by ${Math.round((finishAfter - expFinish) / 3600)}h).` }
    }

    case "expiryRefund": {
      if (cancelAfter === null) {
        return { passed: false, feedback: "No CancelAfter set - if the seller never delivers, the buyer's funds are locked forever with no refund path." }
      }
      const passed = Math.abs(cancelAfter - expCancel) <= tol
      return { passed, feedback: passed
        ? "CancelAfter encodes the 30-day expiry refund path."
        : `CancelAfter does not match the required 30-day expiry window (off by ${Math.round((cancelAfter - expCancel) / 86400)}d).` }
    }

    case "windowOrdering": {
      if (finishAfter === null || cancelAfter === null) {
        return { passed: false, feedback: "Both FinishAfter and CancelAfter must be set before their ordering can be valid." }
      }
      const passed = cancelAfter > finishAfter
      return { passed, feedback: passed
        ? "Refund window correctly opens after the dispute window closes."
        : "CancelAfter must be strictly after FinishAfter - the ledger rejects an escrow whose refund window opens before release is even possible." }
    }

    case "prematureFinishRejected": {
      if (live.available && live.finishResult) {
        const rejected = !live.finishResult.startsWith("tes")
        return { passed: rejected, feedback: rejected
          ? `Live Testnet rejected an immediate EscrowFinish (${live.finishResult}) - the dispute window is enforced by the protocol.`
          : `An immediate EscrowFinish SUCCEEDED (${live.finishResult}) - funds can be released with no dispute window.` }
      }
      // Structural fallback: a future FinishAfter means the ledger would reject
      // an early release (verified live when XRPL_LIVE_GRADING is enabled).
      if (finishAfter === null) {
        return { passed: false, feedback: "Without FinishAfter, an EscrowFinish would be accepted immediately - no dispute window." }
      }
      const passed = finishAfter > now
      return { passed, feedback: passed
        ? "FinishAfter is in the future, so the ledger will reject a premature EscrowFinish."
        : "FinishAfter is not in the future - a premature release would not be blocked." }
    }

    case "valuePreserved": {
      const okDest = tx.Destination === expect.destination
      const expDrops = String(Math.round(expect.amountXrp * 1_000_000))
      const okAmount = String(tx.Amount) === expDrops
      const passed = okDest && okAmount
      return { passed, feedback: passed
        ? "Amount and destination match the payment instruction."
        : "Amount or destination does not match the agreed payment instruction." }
    }

    default:
      return { passed: false, feedback: `Unknown check: ${checkId}` }
  }
}
