import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scoreSubmission, TestCase } from "@/lib/scoring"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { challengeId, answerText, answerJson, timeTakenSeconds } = body

  if (!challengeId || !answerText) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const challenge = await db.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 })

  const allTests = [
    ...(challenge.visibleTests as unknown as TestCase[]).map((t: TestCase) => ({ ...t, isVisible: true })),
    ...(challenge.hiddenTests as unknown as TestCase[]).map((t: TestCase) => ({ ...t, isVisible: false })),
  ]

  const result = scoreSubmission(answerText, answerJson, allTests, challenge.maxScore)

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
      feedbackJson: JSON.parse(JSON.stringify({
        results: result.results,
        missedRequirements: result.missedRequirements,
        improvementSuggestions: result.improvementSuggestions,
        modelAnswer: challenge.modelAnswer,
        explanation: challenge.explanation,
      })),
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
