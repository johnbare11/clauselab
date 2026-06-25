import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import type { User } from "@prisma/client"

/**
 * Returns the ClauseLab user row for the signed-in Clerk user, creating it on
 * first sign-in. Replaces the previous server-to-server fetch to /api/user/sync,
 * which pointed at the wrong host in production and could not carry the auth
 * cookie, so the user was never created.
 */
export async function ensureUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const existing = await db.user.findUnique({ where: { clerkId: userId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
  const email = clerkUser.emailAddresses[0]?.emailAddress || ""

  return db.user.upsert({
    where: { clerkId: userId },
    update: { name, email },
    create: { clerkId: userId, name, email },
  })
}
