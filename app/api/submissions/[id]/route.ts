import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const submission = await db.submission.findUnique({
    where: { id },
    select: { feedbackJson: true, score: true, maxScore: true, hiddenTestsPassed: true, hiddenTestsTotal: true },
  })

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ feedback: submission.feedbackJson })
}
