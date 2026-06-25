"use client"

import { useState } from "react"
import { Badge } from "@/components/badge"

interface ChallengeOption {
  id: string
  title: string
  slug: string
  trackName: string
  difficulty: string
  isXrplRelated: boolean
}

export function SendAssessment({ challenges }: { challenges: ChallengeOption[] }) {
  const [selectedSlug, setSelectedSlug] = useState(challenges[0]?.slug || "")
  const [candidate, setCandidate] = useState("")
  const [copied, setCopied] = useState(false)

  const selected = challenges.find((c) => c.slug === selectedSlug)

  const inviteLink = (() => {
    if (!selected) return ""
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const params = new URLSearchParams({ ref: "invite" })
    if (candidate.trim()) params.set("candidate", candidate.trim())
    return `${origin}/challenges/${selected.slug}?${params.toString()}`
  })()

  const copy = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may be blocked; the link is still selectable below.
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">Challenge</label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-700">
            {challenges.map((c) => (
              <option key={c.id} value={c.slug}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">Candidate name (optional)</label>
          <input
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            placeholder="e.g. Jordan Smith"
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-700 placeholder-gray-700" />
        </div>

        {selected && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="gray">{selected.trackName}</Badge>
            <span className="text-xs text-gray-600">{selected.difficulty}</span>
            {selected.isXrplRelated && <Badge variant="blue">XRPL</Badge>}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-xs text-gray-500 uppercase tracking-widest block">Shareable invite link</label>
        <div className="border border-[#2a2a2a] rounded bg-[#0d0d0d] p-3">
          <code className="text-xs text-blue-300 break-all leading-relaxed">{inviteLink}</code>
        </div>
        <button
          onClick={copy}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors font-medium w-full">
          {copied ? "Copied to clipboard" : "Copy invite link"}
        </button>
        <p className="text-xs text-gray-600 leading-relaxed">
          Send this link to a candidate. They open the challenge directly, submit their answer,
          and their scored result appears in the Candidate Results view.
        </p>
      </div>
    </div>
  )
}
