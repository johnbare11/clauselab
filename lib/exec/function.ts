// Generic executable grading for non-ledger challenges: the candidate's pure
// function is run against named groups of input/output cases, and each test
// passes when every case in its group produces the expected output. This is
// what lets any track - contract logic, compliance rules, AML screening - have
// real code challenges without an XRPL harness.

export interface FunctionCase {
  label: string
  input: Record<string, unknown>
  expect: unknown
}

export interface FunctionSpec {
  kind: "pure-function"
  entry: string
  groups: Record<string, FunctionCase[]>
}

export function isFunctionSpec(spec: unknown): spec is FunctionSpec {
  return !!spec && typeof spec === "object" && (spec as { kind?: unknown }).kind === "pure-function"
}

// Deep equality with a small numeric epsilon, so 0.1 + 0.2 style float noise
// in an otherwise-correct answer does not fail a money calculation.
export function deepEqual(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true
    return Math.abs(a - b) < 1e-9
  }
  if (a === b) return true
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a as Record<string, unknown>)
  const kb = Object.keys(b as Record<string, unknown>)
  if (ka.length !== kb.length) return false
  return ka.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  )
}

function show(v: unknown): string {
  const s = JSON.stringify(v)
  return s === undefined ? String(v) : s.length > 80 ? s.slice(0, 77) + "..." : s
}

export interface GroupOutcome {
  passed: boolean
  feedback: string
}

// Evaluates one test's case group against already-computed outputs.
export function evaluateGroup(
  cases: FunctionCase[],
  outputs: Array<{ ok: boolean; value?: unknown; error?: string }>,
): GroupOutcome {
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]
    const out = outputs[i]
    if (!out.ok) {
      return { passed: false, feedback: `${c.label}: your code threw an error (${out.error}).` }
    }
    if (!deepEqual(out.value, c.expect)) {
      return {
        passed: false,
        feedback: `${c.label}: expected ${show(c.expect)}, got ${show(out.value)}.`,
      }
    }
  }
  return { passed: true, feedback: cases.map((c) => c.label).join("; ") + " - all correct." }
}
