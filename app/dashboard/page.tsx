import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ensureUser } from "@/lib/user"
import { Nav } from "@/components/nav"
import { Badge } from "@/components/badge"
import { difficultyColor, difficultyLabel, modeLabel, scorePercent } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Create the user row on first sign-in, then load with relations.
  await ensureUser()

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      progress: { include: { track: true } },
      submissions: {
        include: { challenge: { include: { track: true } } },
        orderBy: { submittedAt: "desc" },
        take: 10,
      },
    },
  })

  const totalScore = user?.progress.reduce((a, p) => a + p.totalScore, 0) || 0
  const totalCompleted = user?.progress.reduce((a, p) => a + p.challengesCompleted, 0) || 0
  const xrplProgress = user?.progress.filter(p => p.track.slug.startsWith("xrpl-")) || []
  const xrplScore = xrplProgress.reduce((a, p) => a + p.totalScore, 0)
  const xrplCompleted = xrplProgress.reduce((a, p) => a + p.challengesCompleted, 0)

  const recommendedChallenges = await db.challenge.findMany({
    where: { published: true },
    include: { track: true },
    orderBy: { isXrplRelated: "desc" },
    take: 4,
  })

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">{user?.email || "Your ClauseRank progress"}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Score", value: totalScore.toString(), sub: "points earned" },
            { label: "Completed", value: totalCompleted.toString(), sub: "challenges" },
            { label: "XRPL Score", value: xrplScore.toString(), sub: `${xrplCompleted} XRPL challenges` },
            { label: "Plan", value: user?.plan || "FREE", sub: "current tier" },
          ].map((stat) => (
            <div key={stat.label} className="border border-[#1e1e1e] rounded p-4 bg-[#0d0d0d]">
              <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Track progress */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Track Progress</div>
            {user && user.progress.length > 0 ? (
              <div className="border border-[#1e1e1e] rounded overflow-hidden">
                {user.progress.map((p) => (
                  <div key={p.id} className="px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm">{p.track.name}</span>
                        {p.track.slug.startsWith("xrpl-") && <Badge variant="blue">XRPL</Badge>}
                      </div>
                      <span className="text-gray-400 text-xs font-mono">{p.totalScore}pts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, p.challengesCompleted * 20)}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{p.challengesCompleted} done</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-[#1e1e1e] rounded p-6 text-center">
                <p className="text-gray-500 text-sm mb-3">No progress yet. Start a challenge to begin.</p>
                <Link href="/challenges" className="text-sm text-blue-400 hover:text-blue-300">Browse challenges →</Link>
              </div>
            )}
          </div>

          {/* Recent submissions */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Recent Submissions</div>
            {user && user.submissions.length > 0 ? (
              <div className="border border-[#1e1e1e] rounded overflow-hidden">
                {user.submissions.map((s) => {
                  const pct = scorePercent(s.score, s.maxScore)
                  return (
                    <div key={s.id} className="px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm truncate">{s.challenge.title}</div>
                          <div className="text-gray-600 text-xs">{s.challenge.track.name}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <span className={`text-xs font-mono font-medium ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>
                            {s.score}/{s.maxScore}
                          </span>
                          <span className="text-xs text-gray-600">
                            {s.hiddenTestsPassed}/{s.hiddenTestsTotal} hidden
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="border border-[#1e1e1e] rounded p-6 text-center">
                <p className="text-gray-500 text-sm">No submissions yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommended */}
        <div className="mt-8">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Recommended Next</div>
          <div className="grid md:grid-cols-4 gap-3">
            {recommendedChallenges.map((ch) => (
              <Link key={ch.id} href={`/challenges/${ch.slug}`}
                className="border border-[#1e1e1e] hover:border-[#2a2a2a] bg-[#0d0d0d] rounded p-3 transition-all group">
                <div className="flex items-center gap-1.5 mb-2">
                  {ch.isXrplRelated && <Badge variant="blue">XRPL</Badge>}
                  <span className={`text-xs ${difficultyColor(ch.difficulty)}`}>{difficultyLabel(ch.difficulty)}</span>
                </div>
                <div className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors mb-1 line-clamp-2">{ch.title}</div>
                <div className="text-gray-600 text-xs">{modeLabel(ch.mode)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
