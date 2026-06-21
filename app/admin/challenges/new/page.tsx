"use client"

import { useState } from "react"
import { Nav } from "@/components/nav"
import { useRouter } from "next/navigation"

export default function NewChallengePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    trackSlug: "legal-engineering",
    mode: "BUILD",
    difficulty: "BEGINNER",
    description: "",
    scenario: "",
    publicRequirements: "{}",
    starterMaterial: "",
    visibleTests: "[]",
    hiddenTests: "[]",
    scoringRubric: '{"totalWeight": 100, "passMark": 60}',
    modelAnswer: "",
    explanation: "",
    tags: "",
    isXrplRelated: false,
    requiresXrplTestnet: false,
    estimatedMinutes: 20,
    maxScore: 100,
  })

  const update = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          publicRequirements: JSON.parse(form.publicRequirements),
          visibleTests: JSON.parse(form.visibleTests),
          hiddenTests: JSON.parse(form.hiddenTests),
          scoringRubric: JSON.parse(form.scoringRubric),
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (data.slug) router.push(`/challenges/${data.slug}`)
    } catch (e) {
      alert("Error: " + e)
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  )

  const inputCls = "w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
  const textareaCls = `${inputCls} resize-none font-mono text-xs`

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-white">New Challenge</h1>
          <button onClick={save} disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
            {saving ? "Saving..." : "Save & publish"}
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title">
              <input value={form.title} onChange={e => update("title", e.target.value)} className={inputCls} placeholder="Challenge title" />
            </Field>
            <Field label="Track">
              <select value={form.trackSlug} onChange={e => update("trackSlug", e.target.value)} className={inputCls}>
                <option value="legal-engineering">Legal Engineering</option>
                <option value="compliance-risk">Compliance & Risk</option>
                <option value="ai-assisted-legal">AI-Assisted Legal Work</option>
                <option value="xrpl-payments">XRPL Payments</option>
                <option value="xrpl-escrow">XRPL Escrow</option>
                <option value="xrpl-compliance">XRPL Compliance</option>
                <option value="xrpl-tokenisation">XRPL Tokenisation</option>
                <option value="xrpl-identity">XRPL Identity</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Mode">
              <select value={form.mode} onChange={e => update("mode", e.target.value)} className={inputCls}>
                {["BUILD","MODIFY","DEBUG","OPTIMISE","AUDIT","AI_ASSISTED"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={e => update("difficulty", e.target.value)} className={inputCls}>
                {["BEGINNER","INTERMEDIATE","ADVANCED","EXPERT"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Est. Minutes">
              <input type="number" value={form.estimatedMinutes} onChange={e => update("estimatedMinutes", +e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Description (one line)">
            <input value={form.description} onChange={e => update("description", e.target.value)} className={inputCls} />
          </Field>

          <Field label="Scenario">
            <textarea value={form.scenario} onChange={e => update("scenario", e.target.value)} rows={6} className={textareaCls} placeholder="The full scenario text..." />
          </Field>

          <Field label="Public Requirements (JSON)">
            <textarea value={form.publicRequirements} onChange={e => update("publicRequirements", e.target.value)} rows={6} className={textareaCls} />
          </Field>

          <Field label="Starter Material (optional)">
            <textarea value={form.starterMaterial} onChange={e => update("starterMaterial", e.target.value)} rows={4} className={textareaCls} placeholder="Existing clause or pseudocode to modify/debug..." />
          </Field>

          <Field label="Visible Tests (JSON array)">
            <textarea value={form.visibleTests} onChange={e => update("visibleTests", e.target.value)} rows={8} className={textareaCls}
              placeholder='[{"id":"vt1","description":"...","type":"concept","concepts":["keyword"],"weight":10,"isVisible":true}]' />
          </Field>

          <Field label="Hidden Tests (JSON array)">
            <textarea value={form.hiddenTests} onChange={e => update("hiddenTests", e.target.value)} rows={8} className={textareaCls}
              placeholder='[{"id":"ht1","description":"...","type":"concept","concepts":["keyword"],"weight":15,"isVisible":false}]' />
          </Field>

          <Field label="Model Answer">
            <textarea value={form.modelAnswer} onChange={e => update("modelAnswer", e.target.value)} rows={8} className={textareaCls} />
          </Field>

          <Field label="Explanation">
            <textarea value={form.explanation} onChange={e => update("explanation", e.target.value)} rows={3} className={textareaCls} />
          </Field>

          <Field label="Tags (comma-separated)">
            <input value={form.tags} onChange={e => update("tags", e.target.value)} className={inputCls} placeholder="XRPL, escrow, payments" />
          </Field>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.isXrplRelated} onChange={e => update("isXrplRelated", e.target.checked)} className="accent-blue-500" />
              XRPL related
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.requiresXrplTestnet} onChange={e => update("requiresXrplTestnet", e.target.checked)} className="accent-blue-500" />
              Requires XRPL Testnet
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
