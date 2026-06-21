import { NextRequest, NextResponse } from "next/server"
import { fetchXrplTransaction } from "@/lib/xrpl"

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("hash")
  if (!hash) return NextResponse.json({ error: "hash required" }, { status: 400 })
  const tx = await fetchXrplTransaction(hash)
  return NextResponse.json({ transaction: tx })
}
