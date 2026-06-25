"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/badge"
import { XrplPanel } from "@/components/xrpl-panel"
import { difficultyColor, difficultyLabel, modeLabel, scorePercent } from "@/lib/utils"
import Link from "next/link"

interface TestCase {
  id: string
  description: string
  type: string
  weight: number
  keywords?: string[]
  concepts?: string[]
  isVisible: boolean
}

interface Challenge {
  id: string
  title: string
  slug: string
  mode: string
  difficulty: string
  description: string
  scenario: string
  publicRequirements: Record<string, unknown>
  starterMaterial: string | null
  modelAnswer: string
  estimatedMinutes: number
  maxScore: number
  visibleTests: TestCase[]
  track: { name: string; slug: string }
  isXrplRelated: boolean
  requiresXrplTestnet: boolean
  xrplTxHash: string | null
}

interface TestResult {
  id: string
  description: string
  passed: boolean
  weight: number
  isVisible: boolean
  feedback: string
}

interface SubmissionResult {
  submissionId: string
  score: number
  maxScore: number
  feedback?: {
    results: TestResult[]
    missedRequirements: string[]
    improvementSuggestions: string[]
    modelAnswer: string
    explanation: string
  }
}

interface Props {
  challenge: Challenge
  ledgerInfo: { ledger_index: number; close_time_human?: string } | null
  isXrpl: boolean
}

export function ChallengeWorkspace({ challenge, ledgerInfo, isXrpl }: Props) {
  const [answer, setAnswer] = useState(challenge.starterMaterial || "")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [activeTab, setActiveTab] = useState<"problem" | "results">("problem")
  const [visibleRunResults, setVisibleRunResults] = useState<TestResult[] | null>(null)
  const [startTime] = useState(Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  // --- Demo helpers -------------------------------------------------------
  // Builds a deliberately incomplete draft from the model answer: keeps the
  // opening ~40% so early concepts pass but later (and hidden) tests fail,
  // producing a realistic partial score to demonstrate progression.
  const buildPartialDraft = (model: string): string => {
    const lines = model.split("\n").filter((l) => l.trim().length > 0 || true)
    const keep = Math.max(3, Math.ceil(lines.length * 0.4))
    return lines.slice(0, keep).join("\n").trim()
  }

  const loadPartialDraft = () => {
    setAnswer(buildPartialDraft(challenge.modelAnswer || ""))
    setResult(null)
    setVisibleRunResults(null)
    setActiveTab("problem")
  }

  const loadModelAnswer = () => {
    setAnswer(challenge.modelAnswer || "")
    setResult(null)
    setVisibleRunResults(null)
    setActiveTab("problem")
  }

  const resetAnswer = () => {
    setAnswer(challenge.starterMaterial || "")
    setResult(null)
    setVisibleRunResults(null)
    setActiveTab("problem")
  }

  const runVisibleTests = async () => {
    if (!answer.trim()) return
    const res = await fetch("/api/submissions/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: challenge.id, answerText: answer }),
    })
    const data = await res.json()
    if (data.results) {
      setVisibleRunResults(data.results.filter((r: TestResult) => r.isVisible))
    }
  }

  const submit = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          answerText: answer,
          timeTakenSeconds: elapsedSeconds,
        }),
      })
      const data = await res.json()

      const detailRes = await fetch(`/api/submissions/${data.submissionId}`)
      const detailData = await detailRes.json()

      setResult({ ...data, feedback: detailData.feedback })
      setActiveTab("results")
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const req = challenge.publicRequirements as Record<string, unknown>

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel: problem */}
      <div className="w-[420px] shrink-0 border-r border-[#1e1e1e] flex flex-col overflow-hidden">
        <div className="border-b border-[#1e1e1e] px-4 py-3 flex items-center gap-2 bg-[#0a0a0a]">
          <button onClick={() => setActiveTab("problem")}
            className={`text-xs px-3 py-1 rounded transition-colors ${activeTab === "problem" ? "bg-[#1e1e1e] text-white" : "text-gray-500 hover:text-gray-300"}`}>
            Problem
          </button>
          {result && (
            <button onClick={() => setActiveTab("results")}
              className={`text-xs px-3 py-1 rounded transition-colors ${activeTab === "results" ? "bg-[#1e1e1e] text-white" : "text-gray-500 hover:text-gray-300"}`}>
              Results
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "problem" && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={challenge.mode === "BUILD" ? "blue" : challenge.mode === "MODIFY" ? "purple" : challenge.mode === "DEBUG" ? "red" : "gray"}>
                    {modeLabel(challenge.mode)}
                  </Badge>
                  <span className={`text-xs font-medium ${difficultyColor(challenge.difficulty)}`}>{difficultyLabel(challenge.difficulty)}</span>
                  <span className="text-xs text-gray-600">{challenge.track.name}</span>
                  {challenge.isXrplRelated && <Badge variant="blue">XRPL</Badge>}
                </div>
                <h1 className="text-base font-semibold text-white mb-1">{challenge.title}</h1>
                <p className="text-gray-500 text-sm">{challenge.description}</p>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Scenario</div>
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
                  {challenge.scenario}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Requirements</div>
                <div className="space-y-2">
                  {Object.entries(req).map(([key, value]) => (
                    <div key={key} className="border border-[#1a1a1a] rounded p-3 bg-[#0a0a0a]">
                      <div className="text-xs text-gray-500 capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                      {Array.isArray(value) ? (
                        <ul className="space-y-1">
                          {(value as unknown[]).map((v, i) => (
                            <li key={i} className="text-gray-300 text-xs flex gap-2">
                              <span className="text-gray-600 shrink-0">—</span>
                              <span>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : typeof value === "object" && value !== null ? (
                        <div className="text-gray-300 text-xs font-mono space-y-1">
                          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                            <div key={k}><span className="text-gray-500">{k}:</span> {Array.isArray(v) ? (v as unknown[]).join(", ") : String(v)}</div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-300 text-xs">{String(value)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isXrpl && (
                <XrplPanel transaction={null} ledgerInfo={ledgerInfo} txHash={challenge.xrplTxHash} />
              )}

              <div className="text-xs text-gray-600 border-t border-[#1a1a1a] pt-3">
                For education and assessment only. Not legal advice. All scenarios are synthetic.
              </div>
            </>
          )}

          {activeTab === "results" && result && (
            <ResultsPanel result={result} maxScore={challenge.maxScore} />
          )}
        </div>
      </div>

      {/* Right panel: editor + tests */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-[#1e1e1e] px-4 py-2 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600 font-mono">{formatTime(elapsedSeconds)}</span>
            <span className="text-xs text-gray-600">{challenge.estimatedMinutes} min estimated</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={runVisibleTests}
              className="text-xs border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-300 px-3 py-1 rounded transition-colors">
              Run visible tests
            </button>
            <button onClick={submit} disabled={submitting || !answer.trim()}
              className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1 rounded transition-colors font-medium">
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-[#1a1a1a] px-4 py-1.5 flex items-center gap-2 bg-[#0d0d0d]">
            <span className="text-xs text-gray-600">Answer</span>
            <span className="text-xs text-gray-700">·</span>
            <span className="text-xs text-gray-600">{answer.length} chars</span>

            {/* Demo controls — presentation aid for walkthroughs */}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest text-amber-500/70 mr-1">Demo</span>
              <button onClick={loadPartialDraft}
                className="text-[11px] border border-amber-700/40 text-amber-300/90 hover:bg-amber-900/20 px-2 py-0.5 rounded transition-colors">
                Partial draft
              </button>
              <button onClick={loadModelAnswer}
                className="text-[11px] border border-emerald-700/40 text-emerald-300/90 hover:bg-emerald-900/20 px-2 py-0.5 rounded transition-colors">
                Complete answer
              </button>
              <button onClick={resetAnswer}
                className="text-[11px] border border-[#2a2a2a] text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded transition-colors">
                Reset
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={`Write your ${modeLabel(challenge.mode).toLowerCase()} solution here...\n\nStructure your answer clearly. For XRPL challenges, specify the transaction types (EscrowCreate, EscrowFinish, EscrowCancel) and conditions.\n\nFor compliance challenges, define the workflow steps, conditions, and escalation paths.`}
            className="flex-1 resize-none bg-[#0d0d0d] text-gray-200 text-sm font-mono p-4 outline-none placeholder-gray-700 leading-relaxed"
          />
        </div>

        {/* Visible tests panel */}
        <div className="h-[180px] border-t border-[#1e1e1e] flex flex-col">
          <div className="border-b border-[#1a1a1a] px-4 py-2 flex items-center gap-2 bg-[#0a0a0a]">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Visible Tests</span>
            {visibleRunResults && (
              <span className="text-xs text-gray-600">
                {visibleRunResults.filter(r => r.passed).length}/{visibleRunResults.length} passed
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {challenge.visibleTests.map((test: TestCase) => {
              const runResult = visibleRunResults?.find(r => r.id === test.id)
              const passed = runResult?.passed
              const hasRun = visibleRunResults !== null
              return (
                <div key={test.id} className="flex items-start gap-2 px-4 py-2 border-b border-[#1a1a1a] last:border-0">
                  <span className={`text-xs font-mono mt-0.5 ${hasRun ? (passed ? "text-emerald-400" : "text-red-400") : "text-gray-600"}`}>
                    {hasRun ? (passed ? "✓" : "✗") : "○"}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs text-gray-300">{test.description}</span>
                    {runResult && !runResult.passed && (
                      <div className="text-xs text-red-400/70 mt-0.5">{runResult.feedback}</div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-mono">{test.weight}pts</span>
                </div>
              )
            })}
            {challenge.visibleTests.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-600">No visible tests for this challenge. Submit to see all results.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultsPanel({ result, maxScore }: { result: SubmissionResult; maxScore: number }) {
  const pct = scorePercent(result.score, maxScore)
  const allResults = result.feedback?.results || []
  const hidden = allResults.filter(r => !r.isVisible)
  const visible = allResults.filter(r => r.isVisible)

  return (
    <div className="space-y-4">
      <div className="border border-[#1e1e1e] rounded p-4 bg-[#0a0a0a]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300 font-medium">Final Score</span>
          <span className={`text-2xl font-bold font-mono ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {result.score}/{maxScore}
          </span>
        </div>
        <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{pct}%</span>
          <span>{pct >= 70 ? "Pass" : pct >= 50 ? "Partial" : "Needs improvement"}</span>
        </div>
      </div>

      {visible.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Visible Tests</div>
          <div className="border border-[#1e1e1e] rounded overflow-hidden">
            {visible.map((r) => (
              <div key={r.id} className={`flex items-start gap-2 px-3 py-2 border-b border-[#1a1a1a] last:border-0 ${r.passed ? "bg-emerald-900/10" : "bg-red-900/10"}`}>
                <span className={`text-xs font-mono mt-0.5 ${r.passed ? "text-emerald-400" : "text-red-400"}`}>{r.passed ? "✓" : "✗"}</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-300">{r.description}</div>
                  {!r.passed && <div className="text-xs text-red-400/70 mt-0.5">{r.feedback}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hidden.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Hidden Tests</div>
          <div className="border border-[#1e1e1e] rounded overflow-hidden">
            {hidden.map((r) => (
              <div key={r.id} className={`flex items-start gap-2 px-3 py-2 border-b border-[#1a1a1a] last:border-0 ${r.passed ? "bg-emerald-900/10" : "bg-red-900/10"}`}>
                <span className={`text-xs font-mono mt-0.5 ${r.passed ? "text-emerald-400" : "text-red-400"}`}>{r.passed ? "✓" : "✗"}</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-300">{r.description}</div>
                  {!r.passed && <div className="text-xs text-red-400/70 mt-0.5">{r.feedback}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.feedback?.missedRequirements && result.feedback.missedRequirements.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Missed Requirements</div>
          <div className="border border-[#1e1e1e] rounded p-3 bg-[#0a0a0a] space-y-1">
            {result.feedback.missedRequirements.map((m, i) => (
              <div key={i} className="text-xs text-amber-400/80 flex gap-2"><span>—</span><span>{m}</span></div>
            ))}
          </div>
        </div>
      )}

      {result.feedback?.modelAnswer && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Model Answer</div>
          <div className="border border-[#1e1e1e] rounded p-3 bg-[#0a0a0a] text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {result.feedback.modelAnswer}
          </div>
        </div>
      )}

      {result.feedback?.explanation && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Explanation</div>
          <div className="border border-[#1e1e1e] rounded p-3 bg-[#0a0a0a] text-xs text-gray-400 leading-relaxed">
            {result.feedback.explanation}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Link href="/challenges" className="text-xs border border-[#2a2a2a] text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded transition-colors">
          Back to challenges
        </Link>
        <Link href="/dashboard" className="text-xs border border-[#2a2a2a] text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded transition-colors">
          View progress
        </Link>
      </div>
    </div>
  )
}
