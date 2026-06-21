export interface TestCase {
  id: string
  description: string
  type: "keyword" | "structured" | "concept"
  weight: number
  keywords?: string[]
  requiredFields?: { field: string; expectedValue?: string; mustExist?: boolean }[]
  concepts?: string[]
  isVisible: boolean
}

export interface TestResult {
  id: string
  description: string
  passed: boolean
  weight: number
  isVisible: boolean
  feedback: string
}

export interface ScoringResult {
  score: number
  maxScore: number
  visiblePassed: number
  visibleTotal: number
  hiddenPassed: number
  hiddenTotal: number
  results: TestResult[]
  missedRequirements: string[]
  improvementSuggestions: string[]
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

function keywordsPresent(text: string, keywords: string[]): boolean {
  const norm = normalise(text)
  return keywords.every((kw) => {
    const variants = [kw, kw.replace(/-/g, " "), kw.replace(/_/g, " ")]
    return variants.some((v) => norm.includes(normalise(v)))
  })
}

function conceptsPresent(text: string, concepts: string[]): { passed: boolean; missing: string[] } {
  const norm = normalise(text)
  const missing: string[] = []
  for (const concept of concepts) {
    const synonymGroups: Record<string, string[]> = {
      "dispute window": ["dispute", "contest", "objection", "48 hour", "48-hour", "dispute window", "dispute period"],
      "escrow release": ["release", "unlock", "transfer funds", "release escrow", "funds released"],
      "kyc approval": ["kyc", "know your customer", "identity verification", "kyc approved"],
      "sanctions screening": ["sanctions", "ofac", "screening", "sanctioned", "restricted"],
      "jurisdiction check": ["jurisdiction", "restricted jurisdiction", "geographic", "country restriction"],
      "audit log": ["audit", "log", "record", "trail", "audit log", "audit trail"],
      "lock-up period": ["lock", "lock-up", "lockup", "restricted period", "transfer restriction"],
      "refund": ["refund", "return funds", "buyer refund", "reimburs"],
      "expiry": ["expir", "timeout", "30 day", "deadline", "time limit"],
      "delivery confirmation": ["delivery", "confirm", "confirmed delivery", "delivery confirmation"],
    }
    const syns = synonymGroups[concept.toLowerCase()] || [concept.toLowerCase()]
    if (!syns.some((s) => norm.includes(s))) {
      missing.push(concept)
    }
  }
  return { passed: missing.length === 0, missing }
}

function evaluateStructured(answerJson: unknown, requiredFields: TestCase["requiredFields"]): boolean {
  if (!requiredFields || !answerJson || typeof answerJson !== "object") return false
  const obj = answerJson as Record<string, unknown>
  return requiredFields.every(({ field, expectedValue, mustExist }) => {
    const keys = field.split(".")
    let val: unknown = obj
    for (const k of keys) {
      if (val && typeof val === "object") val = (val as Record<string, unknown>)[k]
      else return !mustExist
    }
    if (mustExist && (val === undefined || val === null || val === "")) return false
    if (expectedValue !== undefined) {
      return String(val).toLowerCase().includes(expectedValue.toLowerCase())
    }
    return true
  })
}

export function scoreSubmission(
  answerText: string,
  answerJson: unknown,
  tests: TestCase[],
  maxScore: number
): ScoringResult {
  const results: TestResult[] = []
  let totalWeight = 0
  let earnedWeight = 0

  for (const test of tests) {
    totalWeight += test.weight
    let passed = false
    let feedback = ""

    if (test.type === "keyword" && test.keywords) {
      passed = keywordsPresent(answerText, test.keywords)
      feedback = passed
        ? "Required concepts identified correctly."
        : `Missing: ${test.keywords.join(", ")}`
    } else if (test.type === "concept" && test.concepts) {
      const { passed: p, missing } = conceptsPresent(answerText, test.concepts)
      passed = p
      feedback = passed
        ? "All required concepts addressed."
        : `Missing concepts: ${missing.join(", ")}`
    } else if (test.type === "structured" && test.requiredFields) {
      passed = evaluateStructured(answerJson, test.requiredFields)
      feedback = passed
        ? "Structured fields validated."
        : `Required fields missing or incorrect: ${test.requiredFields.map((f) => f.field).join(", ")}`
    }

    if (passed) earnedWeight += test.weight
    results.push({ id: test.id, description: test.description, passed, weight: test.weight, isVisible: test.isVisible, feedback })
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * maxScore) : 0
  const visibleResults = results.filter((r) => r.isVisible)
  const hiddenResults = results.filter((r) => !r.isVisible)

  const missedRequirements = results
    .filter((r) => !r.passed)
    .map((r) => r.description)

  const improvementSuggestions = missedRequirements.slice(0, 3).map((req) =>
    `Review: ${req}`
  )

  return {
    score,
    maxScore,
    visiblePassed: visibleResults.filter((r) => r.passed).length,
    visibleTotal: visibleResults.length,
    hiddenPassed: hiddenResults.filter((r) => r.passed).length,
    hiddenTotal: hiddenResults.length,
    results,
    missedRequirements,
    improvementSuggestions,
  }
}
