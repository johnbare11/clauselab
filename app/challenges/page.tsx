import { db } from "@/lib/db"
import { Nav } from "@/components/nav"
import { Badge } from "@/components/badge"
import { difficultyColor, difficultyLabel, modeLabel } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ track?: string; difficulty?: string; mode?: string }>
}

export default async function ChallengesPage({ searchParams }: Props) {
  const params = await searchParams
  const tracks = await db.track.findMany({ orderBy: { name: "asc" } })

  const where: Record<string, unknown> = { published: true }
  if (params.track) where.track = { slug: params.track }
  if (params.difficulty) where.difficulty = params.difficulty.toUpperCase()
  if (params.mode) where.mode = params.mode.toUpperCase()

  const challenges = await db.challenge.findMany({
    where,
    include: { track: true },
    orderBy: [{ isXrplRelated: "desc" }, { difficulty: "asc" }, { createdAt: "asc" }],
  })

  const xrplTracks = tracks.filter((t) => t.slug.startsWith("xrpl-"))
  const generalTracks = tracks.filter((t) => !t.slug.startsWith("xrpl-"))
  const difficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]
  const modes = ["BUILD", "MODIFY", "DEBUG", "OPTIMISE", "AUDIT", "AI_ASSISTED"]

  const activeTrack = params.track ? tracks.find((t) => t.slug === params.track) : null

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="w-52 shrink-0">
            <div className="sticky top-20 space-y-6">
              <div>
                <div className="text-xs text-blue-400 uppercase tracking-widest mb-3 font-mono">XRPL Tracks</div>
                <div className="space-y-1">
                  {xrplTracks.map((t) => (
                    <Link key={t.slug} href={`/challenges?track=${t.slug}`}
                      className={`block text-sm px-2 py-1.5 rounded transition-colors ${params.track === t.slug ? "bg-blue-900/30 text-blue-300" : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]"}`}>
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">General Tracks</div>
                <div className="space-y-1">
                  {generalTracks.map((t) => (
                    <Link key={t.slug} href={`/challenges?track=${t.slug}`}
                      className={`block text-sm px-2 py-1.5 rounded transition-colors ${params.track === t.slug ? "bg-[#1e1e1e] text-white" : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]"}`}>
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Difficulty</div>
                <div className="space-y-1">
                  {difficulties.map((d) => (
                    <Link key={d} href={`/challenges?${params.track ? `track=${params.track}&` : ""}difficulty=${d.toLowerCase()}`}
                      className={`block text-sm px-2 py-1.5 rounded transition-colors ${params.difficulty === d.toLowerCase() ? "bg-[#1e1e1e] text-white" : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]"}`}>
                      {difficultyLabel(d)}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Mode</div>
                <div className="space-y-1">
                  {modes.map((m) => (
                    <Link key={m} href={`/challenges?${params.track ? `track=${params.track}&` : ""}mode=${m.toLowerCase()}`}
                      className={`block text-sm px-2 py-1.5 rounded transition-colors ${params.mode === m.toLowerCase() ? "bg-[#1e1e1e] text-white" : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]"}`}>
                      {modeLabel(m)}
                    </Link>
                  ))}
                </div>
              </div>
              {(params.track || params.difficulty || params.mode) && (
                <Link href="/challenges" className="block text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  Clear filters ×
                </Link>
              )}
            </div>
          </aside>

          {/* Challenge list */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {activeTrack ? activeTrack.name : "All Challenges"}
                </h1>
                <p className="text-sm text-gray-500">{challenges.length} challenge{challenges.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="border border-[#1e1e1e] rounded overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_90px_80px_60px] text-xs text-gray-500 uppercase tracking-widest border-b border-[#1e1e1e] px-4 py-2 bg-[#0a0a0a]">
                <span>Challenge</span>
                <span>Mode</span>
                <span>Difficulty</span>
                <span>Track</span>
                <span>Score</span>
              </div>
              {challenges.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No challenges found for this filter.</div>
              )}
              {challenges.map((ch, i) => (
                <Link key={ch.id} href={`/challenges/${ch.slug}`}
                  className={`grid grid-cols-[1fr_80px_90px_80px_60px] items-center px-4 py-3 hover:bg-[#141414] transition-colors border-b border-[#1a1a1a] last:border-0 group ${i % 2 === 0 ? "" : "bg-[#0d0d0d]"}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm group-hover:text-blue-300 transition-colors font-medium">{ch.title}</span>
                      {ch.isXrplRelated && <span className="text-[10px] bg-blue-900/40 text-blue-400 border border-blue-800/50 px-1.5 py-0.5 rounded font-mono">XRPL</span>}
                      {ch.requiresXrplTestnet && <span className="text-[10px] bg-green-900/40 text-green-400 border border-green-800/50 px-1.5 py-0.5 rounded font-mono">Testnet</span>}
                    </div>
                    <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{ch.description}</p>
                  </div>
                  <span className="text-gray-400 text-xs">{modeLabel(ch.mode)}</span>
                  <span className={`text-xs font-medium ${difficultyColor(ch.difficulty)}`}>{difficultyLabel(ch.difficulty)}</span>
                  <span className="text-gray-500 text-xs truncate">{ch.track.name}</span>
                  <span className="text-gray-500 text-xs font-mono">{ch.maxScore}pts</span>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
