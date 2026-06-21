const XRPL_TESTNET_URL = "https://s.altnet.rippletest.net:51234"

export interface XrplEscrowObject {
  Account: string
  Amount: string
  Destination: string
  FinishAfter?: number
  CancelAfter?: number
  Condition?: string
  index: string
  LedgerEntryType: string
  Flags: number
}

export interface XrplTransaction {
  hash: string
  TransactionType: string
  Account: string
  Destination?: string
  Amount?: string | { value: string; currency: string; issuer: string }
  Fee: string
  date?: number
  meta?: { TransactionResult: string }
}

async function xrplRpc(method: string, params: unknown[]) {
  const res = await fetch(XRPL_TESTNET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
    next: { revalidate: 60 },
  })
  const data = await res.json()
  return data.result
}

export async function fetchXrplTransaction(hash: string): Promise<XrplTransaction | null> {
  try {
    const result = await xrplRpc("tx", [{ transaction: hash, binary: false }])
    if (result?.status === "success") {
      return {
        hash: result.hash,
        TransactionType: result.TransactionType,
        Account: result.Account,
        Destination: result.Destination,
        Amount: result.Amount,
        Fee: result.Fee,
        date: result.date,
        meta: result.meta,
      }
    }
    return null
  } catch {
    return null
  }
}

export async function fetchLedgerInfo() {
  try {
    const result = await xrplRpc("ledger", [{ ledger_index: "validated", transactions: false }])
    return result?.ledger || null
  } catch {
    return null
  }
}
