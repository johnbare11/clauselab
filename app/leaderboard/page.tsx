import { db } from "@/lib/db"
import { Nav } from "@/components/nav"
import { Badge } from "@/components/badge"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  const progress = await db.userProgress.findMany({
    include: { user: true, track: true },
    orderBy: { totalScore: "desc" },
    take: 50,
  })

  const byUser = new Map<string, { user: { name: string | null; email: string }; totalScore: number; xrplScore: number; completed: number }>()

  for (const p of progress) {
    const existing = byUser.get(p.userId)
    const isXrpl = p.track.slug.startsWith("xrpl-")
    if (!existing) {
      byUser.set(p.userId, {
        user: p.user,
        totalScore: p.totalScore,
        xrplScore: isXrpl ? p.totalScore : 0,
        completed: p.challengesCompleted,
      })
    } else {
      existing.totalScore += p.totalScore
      if (isXrpl) existing.xrplScore += p.totalScore
      existing.completed += p.challengesCompleted
    }
  }

  const ranked = Array.from(byUser.values()).sort((a, b) => b.totalScore - a.totalScore)

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white mb-1">Leaderboard</h1>
          <p className="text-gray-500 text-sm">Global rankings by total score</p>
        </div>

        <div className="border border-[#1e1e1e] rounded overflow-hidden">
          <div className="grid grid-cols-[50px_1fr_100px_100px_80px] text-xs text-gray-500 uppercase tracking-widest border-b border-[#1e1e1e] px-4 py-2 bg-[#0a0a0a]">
            <span>#</span>
            <span>User</span>
            <span>XRPL Score</span>
            <span>Total Score</span>
            <span>Completed</span>
          </div>
          {ranked.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">No submissions yet. Be the first to complete a challenge.</div>
          )}
          {ranked.map((entry, i) => (
            <div key={i} className={`grid grid-cols-[50px_1fr_100px_100px_80px] items-center px-4 py-3 border-b border-[#1a1a1a] last:border-0 ${i < 3 ? "bg-[#0d0d10]" : ""}`}>
              <span className={`text-sm font-mono font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-600" : "text-gray-600"}`}>
                {i + 1}
              </span>
              <div>
                <div className="text-white text-sm">{entry.user.name || entry.user.email.split("@")[0]}</div>
                {entry.xrplScore > 0 && <Badge variant="blue">XRPL</Badge>}
              </div>
              <span className="text-blue-400 text-sm font-mono">{entry.xrplScore}</span>
              <span className="text-white text-sm font-mono">{entry.totalScore}</span>
              <span className="text-gray-500 text-sm">{entry.completed}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
