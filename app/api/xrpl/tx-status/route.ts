import { NextRequest, NextResponse } from "next/server"
import { createStatus } from "@/lib/exec/testnet"

export const runtime = "nodejs"

// Polled by the client after a live submission to know when the EscrowCreate is
// validated on the ledger (and therefore visible on the explorer), so it can
// reveal the explorer link the instant it will resolve. Checks by tx hash and,
// as the more reliable signal, by whether the escrow object exists on the
// account's validated ledger state.
export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("hash") || undefined
  const account = req.nextUrl.searchParams.get("account") || undefined
  if (hash && !/^[0-9A-Fa-f]{64}$/.test(hash)) {
    return NextResponse.json({ validated: false, error: "Invalid hash" }, { status: 400 })
  }
  if (!hash && !account) {
    return NextResponse.json({ validated: false, error: "Missing hash or account" }, { status: 400 })
  }
  try {
    const status = await createStatus(hash, account)
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({ validated: false })
  }
}
