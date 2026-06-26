import type { ScoringResult, TestResult } from "@/lib/scoring"
import { runCandidate } from "./sandbox"
import { runCheck, EscrowExpect, LiveArtifacts } from "./escrow"
import { liveGradingEnabled, runEscrowLive } from "./testnet"

// Unix -> Ripple epoch (seconds since 2000-01-01). Escrow time fields use this.
const RIPPLE_EPOCH = 946684800

export interface ExecutionTest {
  id: string
  description: string
  type: string
  check: string
  weight: number
  isVisible: boolean
}

export interface ExecutionSpec {
  kind: string
  entry: string
  input: { destination: string; amountXrp: number }
  expect: { finishAfterSeconds: number; cancelAfterSeconds: number; toleranceSeconds: number }
}

export function isExecutionSpec(spec: unknown): spec is ExecutionSpec {
  return (
    !!spec &&
    typeof spec === "object" &&
    (spec as { kind?: unknown }).kind === "xrpl-escrow"
  )
}

export interface ExecutionGrade extends ScoringResult {
  live?: LiveArtifacts
  runtimeError?: string
}

export async function gradeExecution(
  answerText: string,
  spec: ExecutionSpec,
  tests: ExecutionTest[],
  maxScore: number,
  options?: { live?: boolean },
): Promise<ExecutionGrade> {
  const now = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH
  const expect: EscrowExpect = {
    destination: spec.input.destination,
    amountXrp: spec.input.amountXrp,
    finishAfterSeconds: spec.expect.finishAfterSeconds,
    cancelAfterSeconds: spec.expect.cancelAfterSeconds,
    toleranceSeconds: spec.expect.toleranceSeconds,
  }

  const run = runCandidate(answerText, spec.entry, spec.input, now)
  const tx = run.ok ? (run.value as Record<string, unknown> | null) : null

  let live: LiveArtifacts = { attempted: false, available: false }
  const wantLive = (options?.live ?? true) && liveGradingEnabled()
  if (wantLive && tx) {
    try {
      live = await runEscrowLive(tx, expect)
    } catch {
      live = { attempted: true, available: false }
    }
  }

  const results: TestResult[] = []
  let totalWeight = 0
  let earnedWeight = 0
  for (const t of tests) {
    totalWeight += t.weight
    const outcome = run.ok
      ? runCheck(t.check, tx, expect, now, live)
      : { passed: false, feedback: `Your code did not run: ${run.error}` }
    if (outcome.passed) earnedWeight += t.weight
    results.push({
      id: t.id,
      description: t.description,
      passed: outcome.passed,
      weight: t.weight,
      isVisible: t.isVisible,
      feedback: outcome.feedback,
    })
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * maxScore) : 0
  const visible = results.filter((r) => r.isVisible)
  const hidden = results.filter((r) => !r.isVisible)
  const missedRequirements = results.filter((r) => !r.passed).map((r) => r.description)

  return {
    score,
    maxScore,
    visiblePassed: visible.filter((r) => r.passed).length,
    visibleTotal: visible.length,
    hiddenPassed: hidden.filter((r) => r.passed).length,
    hiddenTotal: hidden.length,
    results,
    missedRequirements,
    improvementSuggestions: missedRequirements.slice(0, 3).map((r) => `Review: ${r}`),
    live,
    runtimeError: run.ok ? undefined : run.error,
  }
}
