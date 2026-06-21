import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Nav } from "@/components/nav"
import Link from "next/link"
import { modeLabel, difficultyLabel } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const challenges = await db.challenge.findMany({
    include: { track: true },
    orderBy: { createdAt: "desc" },
  })

  const tracks = await db.track.findMany({ orderBy: { name: "asc" } })
  const totalSubmissions = await db.submission.count()

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white">Admin</h1>
            <p className="text-gray-500 text-sm">Challenge management and platform analytics</p>
          </div>
          <Link href="/admin/challenges/new"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
            + New challenge
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Challenges", value: challenges.length },
            { label: "Tracks", value: tracks.length },
            { label: "Published", value: challenges.filter(c => c.published).length },
            { label: "Submissions", value: totalSubmissions },
          ].map((s) => (
            <div key={s.label} className="border border-[#1e1e1e] rounded p-4 bg-[#0d0d0d]">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="text-2xl font-bold text-white font-mono">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="border border-[#1e1e1e] rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_90px_80px_70px_60px] text-xs text-gray-500 uppercase tracking-widest border-b border-[#1e1e1e] px-4 py-2 bg-[#0a0a0a]">
            <span>Challenge</span>
            <span>Mode</span>
            <span>Difficulty</span>
            <span>Track</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {challenges.map((ch) => (
            <div key={ch.id} className="grid grid-cols-[1fr_80px_90px_80px_70px_60px] items-center px-4 py-3 border-b border-[#1a1a1a] last:border-0 hover:bg-[#141414] transition-colors">
              <div>
                <div className="text-white text-sm">{ch.title}</div>
                <div className="text-gray-600 text-xs flex gap-1 mt-0.5">
                  {ch.isXrplRelated && <span className="text-blue-500">XRPL</span>}
                  {ch.requiresXrplTestnet && <span className="text-green-500">Testnet</span>}
                </div>
              </div>
              <span className="text-gray-400 text-xs">{modeLabel(ch.mode)}</span>
              <span className="text-gray-400 text-xs">{difficultyLabel(ch.difficulty)}</span>
              <span className="text-gray-500 text-xs truncate">{ch.track.name}</span>
              <span className={`text-xs ${ch.published ? "text-emerald-400" : "text-gray-600"}`}>
                {ch.published ? "Published" : "Draft"}
              </span>
              <Link href={`/challenges/${ch.slug}`} className="text-xs text-blue-400 hover:text-blue-300">
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
