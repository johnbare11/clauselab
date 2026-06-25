import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Nav } from "@/components/nav"
import { DemoBanner } from "@/components/demo-banner"
import { SendAssessment } from "@/components/send-assessment"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SendAssessmentPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const challenges = await db.challenge.findMany({
    where: { published: true },
    include: { track: true },
    orderBy: [{ isXrplRelated: "desc" }, { title: "asc" }],
  })

  const options = challenges.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    trackName: c.track.name,
    difficulty: c.difficulty,
    isXrplRelated: c.isXrplRelated,
  }))

  return (
    <div className="min-h-screen">
      <Nav />
      <DemoBanner />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-white">Send an assessment</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="text-gray-500 hover:text-gray-300">Admin</Link>
            <Link href="/admin/results" className="text-blue-400 hover:text-blue-300">Candidate results</Link>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Pick a challenge and share the invite link with a candidate. Their submission is graded
          automatically against visible and hidden tests.
        </p>

        {options.length === 0 ? (
          <div className="border border-[#1e1e1e] rounded p-6 text-sm text-gray-500">No published challenges yet.</div>
        ) : (
          <SendAssessment challenges={options} />
        )}
      </div>
    </div>
  )
}
