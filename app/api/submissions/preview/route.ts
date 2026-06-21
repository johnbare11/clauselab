import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scoreSubmission, TestCase } from "@/lib/scoring"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { challengeId, answerText } = body

  const challenge = await db.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const visibleTests = (challenge.visibleTests as unknown as TestCase[]).map((t: TestCase) => ({ ...t, isVisible: true }))
  const result = scoreSubmission(answerText, null, visibleTests, challenge.maxScore)

  return NextResponse.json({ results: result.results })
}
