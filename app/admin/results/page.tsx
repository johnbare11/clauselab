import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Nav } from "@/components/nav"
import { DemoBanner } from "@/components/demo-banner"
import { Badge } from "@/components/badge"
import { scorePercent } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CandidateResultsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const submissions = await db.submission.findMany({
    include: {
      user: true,
      challenge: { include: { track: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
  })

  return (
    <div className="min-h-screen">
      <Nav />
      <DemoBanner />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-white">Candidate results</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="text-gray-500 hover:text-gray-300">Admin</Link>
            <Link href="/admin/send" className="text-blue-400 hover:text-blue-300">Send assessment</Link>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Every candidate submission, scored against visible and hidden tests.
        </p>

        <div className="border border-[#1e1e1e] rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_90px_110px_90px] text-xs text-gray-500 uppercase tracking-widest border-b border-[#1e1e1e] px-4 py-2 bg-[#0a0a0a]">
            <span>Candidate</span>
            <span>Challenge</span>
            <span>Score</span>
            <span>Hidden tests</span>
            <span>Date</span>
          </div>
          {submissions.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">No submissions yet. Send an assessment to get started.</div>
          )}
          {submissions.map((s) => {
            const pct = scorePercent(s.score, s.maxScore)
            return (
              <div key={s.id} className="grid grid-cols-[1fr_1fr_90px_110px_90px] items-center px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                <div className="min-w-0 pr-2">
                  <div className="text-white text-sm truncate">{s.user.name || s.user.email.split("@")[0]}</div>
                  {s.user.organisation && <div className="text-gray-600 text-xs truncate">{s.user.organisation}</div>}
                </div>
                <div className="min-w-0 pr-2">
                  <div className="text-gray-300 text-sm truncate">{s.challenge.title}</div>
                  <div className="text-gray-600 text-xs truncate flex items-center gap-1.5">
                    {s.challenge.track.name}
                    {s.challenge.isXrplRelated && <Badge variant="blue">XRPL</Badge>}
                  </div>
                </div>
                <span className={`text-sm font-mono font-medium ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>
                  {s.score}/{s.maxScore}
                </span>
                <span className="text-gray-400 text-xs font-mono">{s.hiddenTestsPassed}/{s.hiddenTestsTotal} passed</span>
                <span className="text-gray-600 text-xs">{new Date(s.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
