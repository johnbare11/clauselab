import { NextRequest, NextResponse } from "next/server"
import { txStatus } from "@/lib/exec/testnet"

export const runtime = "nodejs"

// Polled by the client after a live submission to know when the EscrowCreate is
// validated on the ledger (and therefore visible on the Testnet explorer), so
// it can reveal the explorer link the instant it will resolve.
export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("hash")
  if (!hash || !/^[0-9A-Fa-f]{64}$/.test(hash)) {
    return NextResponse.json({ validated: false, error: "Invalid hash" }, { status: 400 })
  }
  try {
    const status = await txStatus(hash)
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({ validated: false })
  }
}
