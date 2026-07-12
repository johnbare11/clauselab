import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scoreSubmission, TestCase } from "@/lib/scoring"
import { gradeExecution, isExecutionSpec, ExecutionTest } from "@/lib/exec/grade"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  const body = await req.json()
  const { challengeId, answerText, answerJson, timeTakenSeconds } = body

  if (!challengeId || !answerText) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const challenge = await db.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 })

  // Guest grading: assessors reviewing the demo can submit any challenge and see
  // the full score without an account. Guest runs are never persisted - they
  // don't write submissions, touch progress, or appear on the leaderboard.

  const allTests = [
    ...(challenge.visibleTests as unknown as TestCase[]).map((t: TestCase) => ({ ...t, isVisible: true })),
    ...(challenge.hiddenTests as unknown as TestCase[]).map((t: TestCase) => ({ ...t, isVisible: false })),
  ]

  // Executable challenges run the candidate's code and grade on the actual XRPL
  // transaction it produces (optionally submitted live on Testnet). Everything
  // else uses the rule-based concept scorer. Both return the same shape.
  const spec = challenge.expectedSolution
  const grade = isExecutionSpec(spec)
    ? await gradeExecution(answerText, spec, allTests as unknown as ExecutionTest[], challenge.maxScore)
    : scoreSubmission(answerText, answerJson, allTests, challenge.maxScore)
  const result = grade
  const live = "live" in grade ? grade.live : undefined

  const feedback = {
    results: result.results,
    missedRequirements: result.missedRequirements,
    improvementSuggestions: result.improvementSuggestions,
    modelAnswer: challenge.modelAnswer,
    explanation: challenge.explanation,
    live: live || null,
  }

  // Anonymous demo run: return the graded result inline (the detail endpoint is
  // auth-gated) and skip all persistence.
  if (!userId) {
    return NextResponse.json({
      submissionId: null,
      guest: true,
      score: result.score,
      maxScore: result.maxScore,
      feedback: JSON.parse(JSON.stringify(feedback)),
    })
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const submission = await db.submission.create({
    data: {
      userId: user.id,
      challengeId,
      answerText,
      answerJson: answerJson || undefined,
      score: result.score,
      maxScore: result.maxScore,
      visibleTestsPassed: result.visiblePassed,
      visibleTestsTotal: result.visibleTotal,
      hiddenTestsPassed: result.hiddenPassed,
      hiddenTestsTotal: result.hiddenTotal,
      feedbackJson: JSON.parse(JSON.stringify(feedback)),
      timeTakenSeconds: timeTakenSeconds || null,
    },
  })

  await db.userProgress.upsert({
    where: { userId_trackId: { userId: user.id, trackId: challenge.trackId } },
    update: {
      totalScore: { increment: result.score },
      challengesCompleted: { increment: 1 },
    },
    create: {
      userId: user.id,
      trackId: challenge.trackId,
      totalScore: result.score,
      challengesCompleted: 1,
      averageScore: result.score,
      hiddenTestPassRate: result.hiddenTotal > 0 ? result.hiddenPassed / result.hiddenTotal : 0,
      xrplReadiness: challenge.isXrplRelated ? (result.score / result.maxScore) * 100 : 0,
    },
  })

  return NextResponse.json({ submissionId: submission.id, score: result.score, maxScore: result.maxScore })
}
