import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ progress: [], submissions: [] })

  const [progress, recentSubmissions] = await Promise.all([
    db.userProgress.findMany({
      where: { userId: user.id },
      include: { track: true },
    }),
    db.submission.findMany({
      where: { userId: user.id },
      include: { challenge: { include: { track: true } } },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
  ])

  return NextResponse.json({ progress, recentSubmissions, user })
}
