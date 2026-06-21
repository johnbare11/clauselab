import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clerkUser = await currentUser()
  if (!clerkUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const user = await db.user.upsert({
    where: { clerkId: userId },
    update: {
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
    },
    create: {
      clerkId: userId,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
    },
  })

  return NextResponse.json({ user })
}
