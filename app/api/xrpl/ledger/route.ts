import { NextResponse } from "next/server"
import { fetchLedgerInfo } from "@/lib/xrpl"

export async function GET() {
  try {
    const ledger = await fetchLedgerInfo()
    return NextResponse.json({ ledger })
  } catch {
    return NextResponse.json({ ledger: null })
  }
}
