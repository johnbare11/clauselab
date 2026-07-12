import type { ScoringResult, TestResult } from "@/lib/scoring"
import { runCandidate } from "./sandbox"
import { runCheck, EscrowExpect, LiveArtifacts } from "./escrow"
import { liveGradingEnabled, runEscrowLive } from "./testnet"
import { FunctionSpec, isFunctionSpec, evaluateGroup } from "./function"

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

export interface EscrowSpec {
  kind: "xrpl-escrow"
  entry: string
  input: { destination: string; amountXrp: number }
  expect: { finishAfterSeconds: number; cancelAfterSeconds: number; toleranceSeconds: number }
}

export type ExecutionSpec = EscrowSpec | FunctionSpec

export function isExecutionSpec(spec: unknown): spec is ExecutionSpec {
  if (!spec || typeof spec !== "object") return false
  const kind = (spec as { kind?: unknown }).kind
  return kind === "xrpl-escrow" || kind === "pure-function"
}

export interface ExecutionGrade extends ScoringResult {
  live?: LiveArtifacts
  runtimeError?: string
}

function summarise(results: TestResult[], maxScore: number, extras: { live?: LiveArtifacts; runtimeError?: string }): ExecutionGrade {
  const totalWeight = results.reduce((s, r) => s + r.weight, 0)
  const earnedWeight = results.filter((r) => r.passed).reduce((s, r) => s + r.weight, 0)
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
    ...extras,
  }
}

// Runs the candidate's function against every case group and grades each test
// on whether its group's cases all produce the expected outputs. No ledger
// involved - this is the path that lets non-blockchain tracks (contract logic,
// compliance rules) have real executable challenges.
function gradeFunction(
  answerText: string,
  spec: FunctionSpec,
  tests: ExecutionTest[],
  maxScore: number,
): ExecutionGrade {
  const now = Math.floor(Date.now() / 1000)

  const results: TestResult[] = []
  let runtimeError: string | undefined
  for (const t of tests) {
    const cases = spec.groups[t.check] ?? []
    let outcome: { passed: boolean; feedback: string }
    if (cases.length === 0) {
      outcome = { passed: false, feedback: `No cases defined for check "${t.check}".` }
    } else {
      const outputs = cases.map((c) => runCandidate(answerText, spec.entry, c.input, now))
      const firstError = outputs.find((o) => !o.ok)
      if (firstError && outputs.every((o) => !o.ok)) runtimeError = firstError.error
      outcome = evaluateGroup(cases, outputs)
    }
    results.push({
      id: t.id,
      description: t.description,
      passed: outcome.passed,
      weight: t.weight,
      isVisible: t.isVisible,
      feedback: outcome.feedback,
    })
  }

  return summarise(results, maxScore, { runtimeError })
}

export async function gradeExecution(
  answerText: string,
  spec: ExecutionSpec,
  tests: ExecutionTest[],
  maxScore: number,
  options?: { live?: boolean },
): Promise<ExecutionGrade> {
  if (isFunctionSpec(spec)) {
    return gradeFunction(answerText, spec, tests, maxScore)
  }

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
  for (const t of tests) {
    const outcome = run.ok
      ? runCheck(t.check, tx, expect, now, live)
      : { passed: false, feedback: `Your code did not run: ${run.error}` }
    results.push({
      id: t.id,
      description: t.description,
      passed: outcome.passed,
      weight: t.weight,
      isVisible: t.isVisible,
      feedback: outcome.feedback,
    })
  }

  return summarise(results, maxScore, { live, runtimeError: run.ok ? undefined : run.error })
}
