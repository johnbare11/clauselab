import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scoreSubmission, TestCase } from "@/lib/scoring"
import { gradeExecution, isExecutionSpec, ExecutionTest } from "@/lib/exec/grade"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { challengeId, answerText } = body

  const challenge = await db.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const visibleTests = (challenge.visibleTests as unknown as TestCase[]).map((t: TestCase) => ({ ...t, isVisible: true }))

  // Public preview never submits live to Testnet (would let anonymous traffic
  // spam the faucet); it runs the candidate's code and grades structurally.
  const spec = challenge.expectedSolution
  if (isExecutionSpec(spec)) {
    const grade = await gradeExecution(
      answerText,
      spec,
      visibleTests as unknown as ExecutionTest[],
      challenge.maxScore,
      { live: false },
    )
    return NextResponse.json({ results: grade.results, runtimeError: grade.runtimeError })
  }

  const result = scoreSubmission(answerText, null, visibleTests, challenge.maxScore)
  return NextResponse.json({ results: result.results })
}
