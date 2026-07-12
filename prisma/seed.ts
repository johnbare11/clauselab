import { PrismaClient, Mode, Difficulty } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding ClauseLab database...")

  // Tracks
  const tracks = await Promise.all([
    prisma.track.upsert({
      where: { slug: "legal-engineering" },
      update: {},
      create: {
        name: "Legal Engineering",
        slug: "legal-engineering",
        description: "Translate legal requirements into structured logic, contract automation, state machines, and obligation workflows.",
        isPremium: false,
        icon: "⚖️",
      },
    }),
    prisma.track.upsert({
      where: { slug: "compliance-risk" },
      update: {},
      create: {
        name: "Compliance & Risk",
        slug: "compliance-risk",
        description: "AML, KYC, sanctions screening, governance controls, and regulatory workflow design.",
        isPremium: false,
        icon: "🛡️",
      },
    }),
    prisma.track.upsert({
      where: { slug: "ai-assisted-legal" },
      update: {},
      create: {
        name: "AI-Assisted Legal Work",
        slug: "ai-assisted-legal",
        description: "Review, repair, and improve AI-generated legal clauses and compliance workflows.",
        isPremium: false,
        icon: "🤖",
      },
    }),
    prisma.track.upsert({
      where: { slug: "xrpl-payments" },
      update: {},
      create: {
        name: "XRPL Payments",
        slug: "xrpl-payments",
        description: "Payment flows, remittances, and settlement logic on the XRP Ledger.",
        isPremium: false,
        icon: "💸",
        isXrplTrack: true,
      },
    }),
    prisma.track.upsert({
      where: { slug: "xrpl-escrow" },
      update: {},
      create: {
        name: "XRPL Escrow",
        slug: "xrpl-escrow",
        description: "Conditional payment release, dispute windows, and expiry logic using XRPL escrow primitives.",
        isPremium: false,
        icon: "🔐",
        isXrplTrack: true,
      },
    }),
    prisma.track.upsert({
      where: { slug: "xrpl-compliance" },
      update: {},
      create: {
        name: "XRPL Compliance",
        slug: "xrpl-compliance",
        description: "KYC/AML controls, sanctions screening, and regulatory conditions for XRPL-based financial flows.",
        isPremium: false,
        icon: "🏦",
        isXrplTrack: true,
      },
    }),
    prisma.track.upsert({
      where: { slug: "xrpl-tokenisation" },
      update: {},
      create: {
        name: "XRPL Tokenisation",
        slug: "xrpl-tokenisation",
        description: "Tokenised assets, trust lines, transfer restrictions, and redemption logic on the XRP Ledger.",
        isPremium: false,
        icon: "🪙",
        isXrplTrack: true,
      },
    }),
    prisma.track.upsert({
      where: { slug: "xrpl-identity" },
      update: {},
      create: {
        name: "XRPL Identity",
        slug: "xrpl-identity",
        description: "Digital identity, KYC gating, credential verification, and access control for XRPL infrastructure.",
        isPremium: false,
        icon: "🪪",
        isXrplTrack: true,
      },
    }),
  ])

  const trackMap = Object.fromEntries(tracks.map((t) => [t.slug, t.id]))

  const challenges = [
    // ─── LEGAL ENGINEERING ────────────────────────────────────────────────
    {
      title: "Fix the Milestone Payment Logic That Pays Without Sign-Off",
      slug: "build-milestone-payment-logic",
      trackId: trackMap["legal-engineering"],
      mode: Mode.DEBUG,
      difficulty: Difficulty.BEGINNER,
      description: "The milestone payment engine releases money without the buyer's written sign-off and lets the supplier resubmit failed acceptance tests forever. Fix the code. It is executed against the contract's delivery scenarios and graded on the actions it actually takes.",
      scenario: `A software supplier is building a compliance platform for a financial institution under milestone-based payment terms:\n- 25% on contract signature, 35% on prototype delivery, 40% on successful acceptance testing.\n- Every milestone payment requires written confirmation from the buyer's authorised signatory - no confirmation, no payment.\n- If acceptance testing fails, the supplier has ONE opportunity to resubmit, within 7 days of the failure.\n- If the second submission fails - or the 7-day resubmission window lapses - the buyer may terminate, with a partial refund of the final milestone due.\n\nThe payment engine below pays out as soon as each milestone event fires, with no signatory gate, and lets the supplier resubmit failed acceptance tests without limit. It looks generous; it is a breach machine.\n\nFix milestoneAction. The platform runs your code against delivery scenarios (including hidden failure paths) and grades the actions it returns.`,
      publicRequirements: {
        function: 'milestoneAction({ milestone, signatoryConfirmed, accepted, attempt, daysSinceFailure, contractValue }) -> action object',
        decisions: [
          '{ action: "HOLD", reason: "AWAITING_WRITTEN_CONFIRMATION" } when the signatory has not confirmed',
          '{ action: "PAY", amount } for a confirmed milestone (25% / 35% / 40% of contractValue)',
          '{ action: "ALLOW_RESUBMISSION" } after a FIRST acceptance failure, within 7 days',
          '{ action: "TERMINATE", refundDue: true } on a second failure or a lapsed resubmission window',
        ],
        note: 'milestone is "SIGNATURE" | "PROTOTYPE" | "ACCEPTANCE". attempt counts acceptance submissions; accepted and daysSinceFailure apply to ACCEPTANCE only.',
      },
      starterMaterialType: "js",
      starterMaterial: `// Milestone payment engine for the platform build contract.
//
// COMMERCIAL TERMS:
//   1. 25% on signature, 35% on prototype, 40% on acceptance.
//   2. EVERY payment needs the buyer's written signatory confirmation.
//   3. Failed acceptance: ONE resubmission, within 7 days of failure.
//   4. Second failure or lapsed window: buyer may terminate,
//      partial refund of the final milestone due.
//
// This version pays on every event and forgives failure forever.
// Fix milestoneAction.
function milestoneAction({ milestone, accepted, contractValue }) {
  if (milestone === "SIGNATURE") return { action: "PAY", amount: 0.25 * contractValue }
  if (milestone === "PROTOTYPE") return { action: "PAY", amount: 0.35 * contractValue }
  if (accepted) return { action: "PAY", amount: 0.40 * contractValue }
  return { action: "ALLOW_RESUBMISSION" }
}`,
      expectedSolution: {
        kind: "pure-function",
        entry: "milestoneAction",
        groups: {
          signatureMilestone: [
            { label: "Confirmed signature milestone pays 25%", input: { milestone: "SIGNATURE", signatoryConfirmed: true, accepted: false, attempt: 0, daysSinceFailure: 0, contractValue: 100000 }, expect: { action: "PAY", amount: 25000 } },
          ],
          writtenConfirmationGate: [
            { label: "Prototype delivered but no written sign-off yet", input: { milestone: "PROTOTYPE", signatoryConfirmed: false, accepted: false, attempt: 0, daysSinceFailure: 0, contractValue: 100000 }, expect: { action: "HOLD", reason: "AWAITING_WRITTEN_CONFIRMATION" } },
          ],
          acceptancePaid: [
            { label: "Confirmed, passed acceptance pays 40%", input: { milestone: "ACCEPTANCE", signatoryConfirmed: true, accepted: true, attempt: 1, daysSinceFailure: 0, contractValue: 100000 }, expect: { action: "PAY", amount: 40000 } },
          ],
          resubmissionOnce: [
            { label: "First failure, day 3 - resubmission allowed", input: { milestone: "ACCEPTANCE", signatoryConfirmed: true, accepted: false, attempt: 1, daysSinceFailure: 3, contractValue: 100000 }, expect: { action: "ALLOW_RESUBMISSION" } },
          ],
          secondFailureTerminates: [
            { label: "Second failure - termination with refund", input: { milestone: "ACCEPTANCE", signatoryConfirmed: true, accepted: false, attempt: 2, daysSinceFailure: 2, contractValue: 100000 }, expect: { action: "TERMINATE", refundDue: true } },
          ],
          resubmissionWindow: [
            { label: "First failure but window lapsed (day 10)", input: { milestone: "ACCEPTANCE", signatoryConfirmed: true, accepted: false, attempt: 1, daysSinceFailure: 10, contractValue: 100000 }, expect: { action: "TERMINATE", refundDue: true } },
            { label: "Day 7 exactly - still within the window", input: { milestone: "ACCEPTANCE", signatoryConfirmed: true, accepted: false, attempt: 1, daysSinceFailure: 7, contractValue: 100000 }, expect: { action: "ALLOW_RESUBMISSION" } },
          ],
        },
      },
      visibleTests: [
        { id: "vt1", description: "Milestone percentages pay correctly when confirmed", type: "execution", check: "signatureMilestone", weight: 15, isVisible: true },
        { id: "vt2", description: "No payment without written signatory confirmation", type: "execution", check: "writtenConfirmationGate", weight: 20, isVisible: true },
        { id: "vt3", description: "Passed acceptance releases the final 40%", type: "execution", check: "acceptancePaid", weight: 15, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "One resubmission is allowed after a first failure", type: "execution", check: "resubmissionOnce", weight: 15, isVisible: false },
        { id: "ht2", description: "A second failure triggers termination with refund", type: "execution", check: "secondFailureTerminates", weight: 20, isVisible: false },
        { id: "ht3", description: "The 7-day resubmission window is enforced exactly", type: "execution", check: "resubmissionWindow", weight: 15, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `function milestoneAction({ milestone, signatoryConfirmed, accepted, attempt, daysSinceFailure, contractValue }) {
  // Term 2: no milestone pays without the buyer's written sign-off.
  if (!signatoryConfirmed) {
    return { action: "HOLD", reason: "AWAITING_WRITTEN_CONFIRMATION" }
  }

  if (milestone === "SIGNATURE") return { action: "PAY", amount: 0.25 * contractValue }
  if (milestone === "PROTOTYPE") return { action: "PAY", amount: 0.35 * contractValue }

  // ACCEPTANCE:
  if (accepted) return { action: "PAY", amount: 0.40 * contractValue }

  // Terms 3-4: one resubmission, within 7 days; otherwise termination
  // with a partial refund of the final milestone.
  if (attempt === 1 && daysSinceFailure <= 7) {
    return { action: "ALLOW_RESUBMISSION" }
  }
  return { action: "TERMINATE", refundDue: true }
}`,
      explanation: "The buggy engine has two breaches: it pays on events rather than on the buyer's written confirmation (erasing the signatory control that protects the paying party), and its failure path is a single unconditional ALLOW_RESUBMISSION - unlimited retries, no 7-day window, no termination right, no refund. The fix puts the signatory gate first, then encodes the failure ladder exactly: one resubmission inside 7 days, termination with refund after that. The boundary case - day 7 is still inside the window - is the kind of detail that decides real disputes.",
      tags: ["milestones", "payments", "acceptance-testing", "termination", "executable", "legal-engineering"],
      isXrplRelated: false,
      requiresXrplTestnet: false,
      estimatedMinutes: 20,
      maxScore: 100,
    },
    {
      title: "Fix the Late-Fee Calculator That Breaches the Contract",
      slug: "fix-late-fee-cap-breach",
      trackId: trackMap["legal-engineering"],
      mode: Mode.MODIFY,
      difficulty: Difficulty.BEGINNER,
      description: "A late-fee function passes its unit tests but overcharges in exactly the ways the contract forbids. Fix the code. It is executed against the deal's payment scenarios and graded on the numbers it actually returns.",
      scenario: `A services agreement (Clause 9.3) sets out late-payment fees:\n- No fee if payment arrives within the 5-day grace period after the due date.\n- After that: 2% of the overdue amount for each commenced 30-day period, counted from the due date.\n- Late fees are capped at 10% of the overdue amount in total.\n\nFinance shipped the calculator below. The numbers "look right" and the happy-path unit test passes. But it charges customers during the grace period and keeps charging past the contractual cap - both are breaches that would have to be refunded, with interest, under the agreement's remediation clause.\n\nFix lateFee so it charges exactly what the contract allows. The platform runs your code against payment scenarios from the deal (including hidden boundary cases) and grades the fees it actually returns.`,
      publicRequirements: {
        function: "lateFee({ amount, daysLate }) -> fee as a number, rounded to 2 decimal places",
        contractTerms: [
          "Clause 9.3.1: no fee within the 5-day grace period",
          "Clause 9.3.2: 2% of the overdue amount per commenced 30-day period from the due date",
          "Clause 9.3.3: total late fees capped at 10% of the overdue amount",
        ],
        note: "Your code runs in a sandbox; it must return a number.",
      },
      starterMaterialType: "js",
      starterMaterial: `// Late-fee calculator for the services agreement (Clause 9.3).
//
// CONTRACT TERMS:
//   9.3.1  No late fee if payment arrives within the 5-day grace period.
//   9.3.2  After that: 2% of the overdue amount for each commenced
//          30-day period, counted from the due date.
//   9.3.3  Late fees are capped at 10% of the overdue amount in total.
//
// Finance signed this off - the numbers "look right". They are not.
// Fix lateFee so it charges exactly what the contract allows.
function lateFee({ amount, daysLate }) {
  const periods = Math.ceil(daysLate / 30)
  const fee = 0.02 * amount * periods
  return Math.round(fee * 100) / 100
}`,
      expectedSolution: {
        kind: "pure-function",
        entry: "lateFee",
        groups: {
          standardPeriod: [
            { label: "£10,000 paid 20 days late (one period)", input: { amount: 10000, daysLate: 20 }, expect: 200 },
          ],
          graceWindow: [
            { label: "£10,000 paid 3 days late (within grace)", input: { amount: 10000, daysLate: 3 }, expect: 0 },
          ],
          capApplied: [
            { label: "£10,000 paid 200 days late (cap binds)", input: { amount: 10000, daysLate: 200 }, expect: 1000 },
          ],
          graceBoundary: [
            { label: "Exactly 5 days late (last day of grace)", input: { amount: 10000, daysLate: 5 }, expect: 0 },
            { label: "6 days late (first chargeable day)", input: { amount: 10000, daysLate: 6 }, expect: 200 },
          ],
          periodBoundary: [
            { label: "30 days late (still one period)", input: { amount: 10000, daysLate: 30 }, expect: 200 },
            { label: "31 days late (second period commences)", input: { amount: 10000, daysLate: 31 }, expect: 400 },
          ],
          capBoundary: [
            { label: "150 days late (fee meets the cap exactly)", input: { amount: 10000, daysLate: 150 }, expect: 1000 },
            { label: "180 days late (fee must not exceed the cap)", input: { amount: 10000, daysLate: 180 }, expect: 1000 },
          ],
        },
      },
      visibleTests: [
        { id: "vt1", description: "Standard late payment is charged 2% per period", type: "execution", check: "standardPeriod", weight: 20, isVisible: true },
        { id: "vt2", description: "No fee is charged within the grace period", type: "execution", check: "graceWindow", weight: 20, isVisible: true },
        { id: "vt3", description: "Fees are capped at 10% of the overdue amount", type: "execution", check: "capApplied", weight: 20, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "Grace-period boundary days are handled exactly", type: "execution", check: "graceBoundary", weight: 15, isVisible: false },
        { id: "ht2", description: "Period boundaries follow 'commenced 30-day period'", type: "execution", check: "periodBoundary", weight: 15, isVisible: false },
        { id: "ht3", description: "The cap holds at and beyond the crossover point", type: "execution", check: "capBoundary", weight: 10, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `function lateFee({ amount, daysLate }) {
  // Clause 9.3.1 - grace period: nothing is chargeable at 5 days or less.
  if (daysLate <= 5) return 0

  // Clause 9.3.2 - 2% per commenced 30-day period from the due date.
  const periods = Math.ceil(daysLate / 30)
  const fee = 0.02 * amount * periods

  // Clause 9.3.3 - total late fees capped at 10% of the overdue amount.
  const cap = 0.10 * amount
  return Math.round(Math.min(fee, cap) * 100) / 100
}`,
      explanation: "The shipped code gets the visible happy path right (2% per commenced period) but breaches the contract twice: it charges inside the 5-day grace period, and it keeps accruing past the 10% cap. Both look like small numerical details in review; both are refund events under the remediation clause. The fix is three lines that map one-to-one onto the clause: a grace-period guard, the period fee, and a cap. Reading the code against the contract - not against the unit tests - is the skill being measured.",
      tags: ["contract", "late-fees", "cap", "grace-period", "executable", "legal-engineering"],
      isXrplRelated: false,
      requiresXrplTestnet: false,
      estimatedMinutes: 15,
      maxScore: 100,
    },
    {
      title: "Modify a Termination Clause",
      slug: "modify-termination-clause",
      trackId: trackMap["legal-engineering"],
      mode: Mode.MODIFY,
      difficulty: Difficulty.INTERMEDIATE,
      description: "Modify an existing termination clause to satisfy new regulatory and commercial requirements.",
      scenario: `A financial services company has an existing master services agreement with a technology vendor. Recent FCA guidance requires changes to the termination provisions for outsourcing arrangements.\n\nYou must modify the existing clause to comply with the new requirements.`,
      publicRequirements: {
        existingClause: "Either party may terminate this agreement on 30 days written notice. The company may terminate immediately on material breach.",
        newRequirements: [
          "Minimum 90-day notice period for termination by the company (regulatory requirement for outsourcing)",
          "Exit plan must be agreed before notice period begins",
          "Vendor must continue services during notice period",
          "Immediate termination right preserved only for insolvency or regulatory prohibition",
          "Data return and destruction obligations must be specified on termination",
        ],
      },
      starterMaterial: "Either party may terminate this agreement on 30 days written notice. The company may terminate immediately on material breach.",
      starterMaterialType: "contract",
      visibleTests: [
        { id: "vt1", description: "Notice period extended to 90 days", type: "concept", concepts: ["90 day"], weight: 15, isVisible: true },
        { id: "vt2", description: "Exit plan requirement is included", type: "concept", concepts: ["exit plan"], weight: 10, isVisible: true },
        { id: "vt3", description: "Service continuity during notice period addressed", type: "concept", concepts: ["continu"], weight: 10, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "Immediate termination right limited to insolvency or regulatory prohibition", type: "concept", concepts: ["insolven"], weight: 15, isVisible: false },
        { id: "ht2", description: "Data return obligation specified on termination", type: "concept", concepts: ["data return", "data destruction", "data"], weight: 20, isVisible: false },
        { id: "ht3", description: "Exit plan must be agreed before notice period begins", type: "concept", concepts: ["before", "prior", "exit plan"], weight: 15, isVisible: false },
        { id: "ht4", description: "Regulatory prohibition included as immediate termination trigger", type: "concept", concepts: ["regulat"], weight: 15, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `TERMINATION\n\n(a) Termination for convenience: The Company may terminate this Agreement on not less than 90 days' prior written notice to the Vendor. Notice of termination shall not take effect until the parties have agreed a written exit plan in accordance with clause (d) below.\n\n(b) Termination for cause: Either party may terminate this Agreement immediately on written notice if the other party: (i) becomes insolvent, enters administration, or makes an arrangement with creditors; or (ii) is prohibited from performing its obligations by any applicable regulatory authority.\n\n(c) Service continuity: The Vendor shall continue to perform all services throughout the notice period at no additional cost.\n\n(d) Exit plan: Prior to termination taking effect, the parties shall agree a written exit plan setting out knowledge transfer, transition assistance, and service handover steps.\n\n(e) Data obligations: On termination, the Vendor shall within 30 days: (i) return all Company data in a format specified by the Company; and (ii) destroy all copies of Company data in its possession and certify such destruction in writing.`,
      explanation: "FCA outsourcing rules (SS2/21) require enhanced termination provisions for material outsourcing arrangements, including minimum notice periods and exit planning requirements.",
      tags: ["termination", "outsourcing", "FCA", "regulatory", "data"],
      isXrplRelated: false,
      requiresXrplTestnet: false,
      estimatedMinutes: 25,
      maxScore: 100,
    },
    {
      // Retired: its state-transition skill is now tested (executably) by the
      // milestone payment challenge; the keyword-graded essay version stays
      // unpublished rather than diluting the code-first library.
      published: false,
      title: "Design a Contract State Machine",
      slug: "design-contract-state-machine",
      trackId: trackMap["legal-engineering"],
      mode: Mode.BUILD,
      difficulty: Difficulty.INTERMEDIATE,
      description: "Build a complete state machine for a conditional payment agreement covering all valid transitions and failure states.",
      scenario: `A cross-border supply agreement requires a state machine to govern the payment and delivery lifecycle. The agreement involves a buyer (UK), a seller (Singapore), and a freight forwarder.\n\nEvents that can occur: contract_signed, goods_shipped, bill_of_lading_issued, goods_received, inspection_passed, inspection_failed, dispute_raised, dispute_resolved, payment_released, contract_terminated.\n\nYou must define: all states, valid transitions between states, conditions for each transition, and what happens on invalid transitions.`,
      publicRequirements: {
        parties: ["Buyer (UK)", "Seller (Singapore)", "Freight Forwarder"],
        events: ["contract_signed", "goods_shipped", "bill_of_lading_issued", "goods_received", "inspection_passed", "inspection_failed", "dispute_raised", "dispute_resolved", "payment_released", "contract_terminated"],
        requirements: [
          "Payment releases only after inspection passes",
          "Buyer has 72 hours after receipt to raise inspection failure",
          "One reinspection permitted after failure",
          "Dispute blocks payment release",
          "Contract can be terminated on second inspection failure",
        ],
      },
      starterMaterial: null,
      visibleTests: [
        { id: "vt1", description: "At least 5 named states defined", type: "concept", concepts: ["state", "status"], weight: 10, isVisible: true },
        { id: "vt2", description: "Payment release condition ties to inspection", type: "concept", concepts: ["inspection", "payment"], weight: 15, isVisible: true },
        { id: "vt3", description: "Dispute state blocks payment", type: "concept", concepts: ["dispute", "block"], weight: 10, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "72-hour inspection window specified", type: "concept", concepts: ["72 hour", "72-hour"], weight: 15, isVisible: false },
        { id: "ht2", description: "Second inspection failure leads to termination", type: "concept", concepts: ["second", "terminat"], weight: 15, isVisible: false },
        { id: "ht3", description: "Invalid transitions are addressed", type: "concept", concepts: ["invalid", "not permitted", "cannot"], weight: 15, isVisible: false },
        { id: "ht4", description: "Bill of lading included as state trigger", type: "concept", concepts: ["bill of lading", "lading"], weight: 10, isVisible: false },
        { id: "ht5", description: "Dispute resolution allows payment to resume", type: "concept", concepts: ["resolv"], weight: 10, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 55 },
      modelAnswer: `CONTRACT STATE MACHINE\n\nSTATES:\nDRAFT, SIGNED, SHIPPED, IN_TRANSIT, DELIVERED, UNDER_INSPECTION, INSPECTION_PASSED, INSPECTION_FAILED, REINSPECTION, DISPUTED, PAYMENT_RELEASED, TERMINATED\n\nTRANSITIONS:\nDRAFT → SIGNED: contract_signed [both parties executed]\nSIGNED → SHIPPED: goods_shipped [seller notification]\nSHIPPED → IN_TRANSIT: bill_of_lading_issued [freight forwarder confirmation]\nIN_TRANSIT → DELIVERED: goods_received [buyer acknowledgement]\nDELIVERED → UNDER_INSPECTION: automatic [72-hour inspection window opens]\nUNDER_INSPECTION → INSPECTION_PASSED: inspection_passed [within 72 hours]\nUNDER_INSPECTION → INSPECTION_FAILED: inspection_failed [within 72 hours]\nUNDER_INSPECTION → INSPECTION_PASSED: timeout [72 hours elapsed with no failure raised]\nINSPECTION_PASSED → PAYMENT_RELEASED: payment_released [automatic]\nINSPECTION_FAILED → REINSPECTION: [one reinspection permitted]\nREINSPECTION → INSPECTION_PASSED: inspection_passed\nREINSPECTION → TERMINATED: inspection_failed [second failure]\nAny state → DISPUTED: dispute_raised [freezes payment_released transition]\nDISPUTED → [previous state]: dispute_resolved\n\nINVALID TRANSITIONS: Any attempt to trigger payment_released while in DISPUTED state is rejected. Transition from INSPECTION_FAILED directly to PAYMENT_RELEASED is not permitted.`,
      explanation: "State machines are essential for contracts with conditional payment logic. The key skill is identifying all reachable states and ensuring no valid scenario leads to an undefined state.",
      tags: ["state-machine", "supply-chain", "payment", "inspection"],
      isXrplRelated: false,
      requiresXrplTestnet: false,
      estimatedMinutes: 30,
      maxScore: 100,
    },

    // ─── COMPLIANCE & RISK ────────────────────────────────────────────────
    {
      title: "Build a KYC Approval Workflow",
      slug: "build-kyc-approval-workflow",
      trackId: trackMap["compliance-risk"],
      mode: Mode.BUILD,
      difficulty: Difficulty.BEGINNER,
      description: "Design a complete KYC workflow for onboarding institutional clients to a digital asset platform.",
      scenario: `A regulated digital asset exchange is onboarding institutional clients. You must design a KYC workflow that satisfies the firm's AML obligations and allows the compliance team to onboard efficiently.\n\nThe client types are: Corporate (UK), Corporate (Non-UK), High Net Worth Individual, and Politically Exposed Person (PEP).\n\nRequired checks vary by client type. All clients require identity verification and sanctions screening. Corporate clients require Ultimate Beneficial Owner (UBO) identification. PEPs require Enhanced Due Diligence (EDD) and senior management sign-off.`,
      publicRequirements: {
        clientTypes: ["Corporate UK", "Corporate Non-UK", "High Net Worth Individual", "PEP"],
        universalChecks: ["Identity verification", "Sanctions screening"],
        additionalChecks: {
          "Corporate UK": ["Companies House verification", "UBO identification (>25% ownership)", "Director verification"],
          "Corporate Non-UK": ["Equivalent company registry verification", "UBO identification", "Director verification", "Country risk assessment"],
          "PEP": ["Enhanced Due Diligence", "Source of wealth", "Senior management sign-off", "Annual review"],
        },
        escalationTriggers: ["Sanctions match", "PEP status identified", "High-risk jurisdiction", "Unusual transaction patterns during onboarding"],
      },
      starterMaterial: null,
      visibleTests: [
        { id: "vt1", description: "Identity verification included for all client types", type: "concept", concepts: ["identity verification", "identity"], weight: 10, isVisible: true },
        { id: "vt2", description: "Sanctions screening included for all client types", type: "concept", concepts: ["sanctions"], weight: 10, isVisible: true },
        { id: "vt3", description: "UBO identification required for corporate clients", type: "concept", concepts: ["ubo", "beneficial owner"], weight: 10, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "EDD required for PEPs", type: "concept", concepts: ["enhanced due diligence", "edd"], weight: 15, isVisible: false },
        { id: "ht2", description: "Senior management sign-off for PEP clients", type: "concept", concepts: ["senior management", "sign-off", "approval"], weight: 15, isVisible: false },
        { id: "ht3", description: "Country risk assessment for non-UK corporates", type: "concept", concepts: ["country risk", "jurisdiction risk"], weight: 10, isVisible: false },
        { id: "ht4", description: "Escalation path for sanctions match", type: "concept", concepts: ["escalat", "sanctions match"], weight: 15, isVisible: false },
        { id: "ht5", description: "Annual review for PEP clients specified", type: "concept", concepts: ["annual review", "periodic review"], weight: 15, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `KYC ONBOARDING WORKFLOW\n\nSTEP 1 - CLIENT CLASSIFICATION\nDetermine: Corporate UK / Corporate Non-UK / HNWI / PEP\nIf PEP flag triggered at any stage: escalate to EDD path\n\nSTEP 2 - UNIVERSAL CHECKS (all clients)\n- Identity verification: government-issued photo ID + proof of address\n- Sanctions screening: OFAC, UN, HMT, EU consolidated list\n- PEP screening: commercial database check\n\nSTEP 3 - CLIENT-TYPE CHECKS\nCorporate UK: Companies House verification, director verification, UBO identification (all persons owning >25%)\nCorporate Non-UK: Equivalent registry verification, director verification, UBO identification, country risk assessment\nHNWI: Source of wealth declaration, source of funds verification\nPEP: Enhanced Due Diligence, source of wealth, source of funds, senior management sign-off required\n\nSTEP 4 - ESCALATION TRIGGERS\n- Sanctions match → immediate freeze, MLRO referral\n- PEP identified → EDD required before onboarding proceeds\n- High-risk jurisdiction → Country risk assessment + compliance director approval\n- Adverse media → MLRO review\n\nSTEP 5 - APPROVAL\nStandard clients: Compliance officer approval\nPEP clients: Senior management sign-off + annual review scheduled\nRejected clients: Refusal recorded with rationale; SAR consideration`,
      explanation: "KYC workflows must be proportionate to client risk. The core skill is mapping client types to the correct due diligence requirements and building escalation paths for high-risk indicators.",
      tags: ["KYC", "AML", "due-diligence", "compliance", "PEP"],
      isXrplRelated: false,
      requiresXrplTestnet: false,
      estimatedMinutes: 25,
      maxScore: 100,
    },
    {
      title: "Fix the Screening Rule That Cleared a Sanctioned Payment",
      slug: "debug-sanctions-screening-rule",
      trackId: trackMap["compliance-risk"],
      mode: Mode.DEBUG,
      difficulty: Difficulty.INTERMEDIATE,
      description: "A sanctions screening function passed code review - and an £8,500 payment to a sanctioned entity. Fix the code. It is executed against real screening scenarios and graded on the decisions it actually makes.",
      scenario: `A payment platform's automated sanctions screening cleared an £8,500 payment to a sanctioned entity. The audit found the entity was on the list - under a slightly different spelling.\n\nThe screening function below is what shipped. It compiles, it has unit tests, and it looks reasonable in review. It is also a regulatory breach waiting to happen - and over-blocking innocent customers would be a failure too.\n\nFix screenPayment so it makes the decisions the compliance manual requires. The platform runs your code against a set of screening scenarios (including hidden edge cases) and grades the actual decisions it returns.`,
      publicRequirements: {
        function: 'screenPayment({ recipient, sanctions, aliases }) -> "BLOCK" | "REVIEW" | "ALLOW"',
        complianceManual: [
          "BLOCK when the recipient matches a sanctions entry or a known alias - ignoring case, punctuation, and extra spaces",
          "REVIEW when the same name appears with its parts reordered (e.g. 'Petrov, Ivan' vs 'Ivan Petrov')",
          "ALLOW everything else - blocking innocent customers (de-risking) is also a compliance failure",
        ],
        note: "Your code runs in a sandbox; it must return one of the three decision strings.",
      },
      starterMaterialType: "js",
      starterMaterial: `// Outbound payment sanctions screening.
//
// COMPLIANCE MANUAL (s.4.2 - screening decisions):
//   1. BLOCK: recipient matches a sanctions entry or a known alias,
//      ignoring case, punctuation, and extra spaces.
//   2. REVIEW: the same name with its parts reordered
//      (e.g. "Petrov, Ivan" vs "Ivan Petrov").
//   3. ALLOW everything else. Over-blocking innocent customers is
//      also a failure.
//
// This version screens the exact list spelling only. It passed code
// review - and an £8,500 payment to a sanctioned entity.
// Fix screenPayment.
function screenPayment({ recipient, sanctions, aliases }) {
  for (const name of sanctions) {
    if (recipient === name) return "BLOCK"
  }
  return "ALLOW"
}`,
      expectedSolution: {
        kind: "pure-function",
        entry: "screenPayment",
        groups: {
          exactBlock: [
            { label: "Recipient exactly on the sanctions list", input: { recipient: "Ivan Petrov", sanctions: ["Ivan Petrov", "Aurora Shipping Ltd"], aliases: ["Vanya Petrov", "Aurora Shipping Limited"] }, expect: "BLOCK" },
          ],
          normalisedBlock: [
            { label: "Upper case with trailing punctuation", input: { recipient: "IVAN PETROV.", sanctions: ["Ivan Petrov", "Aurora Shipping Ltd"], aliases: ["Vanya Petrov", "Aurora Shipping Limited"] }, expect: "BLOCK" },
            { label: "Extra internal spaces", input: { recipient: "Aurora  Shipping   Ltd", sanctions: ["Ivan Petrov", "Aurora Shipping Ltd"], aliases: ["Vanya Petrov", "Aurora Shipping Limited"] }, expect: "BLOCK" },
          ],
          aliasBlock: [
            { label: "Known alias of a listed person", input: { recipient: "Vanya Petrov", sanctions: ["Ivan Petrov", "Aurora Shipping Ltd"], aliases: ["Vanya Petrov", "Aurora Shipping Limited"] }, expect: "BLOCK" },
          ],
          reorderedReview: [
            { label: "Surname-first ordering of a listed name", input: { recipient: "Petrov, Ivan", sanctions: ["Ivan Petrov", "Aurora Shipping Ltd"], aliases: ["Vanya Petrov", "Aurora Shipping Limited"] }, expect: "REVIEW" },
          ],
          innocentAllowed: [
            { label: "Unrelated customer", input: { recipient: "Maria Santos", sanctions: ["Ivan Petrov", "Aurora Shipping Ltd"], aliases: ["Vanya Petrov", "Aurora Shipping Limited"] }, expect: "ALLOW" },
            { label: "Similar but distinct name (must not over-block)", input: { recipient: "Ivana Petrova", sanctions: ["Ivan Petrov", "Aurora Shipping Ltd"], aliases: ["Vanya Petrov", "Aurora Shipping Limited"] }, expect: "ALLOW" },
          ],
          aliasNormalised: [
            { label: "Alias in upper case", input: { recipient: "VANYA PETROV", sanctions: ["Ivan Petrov", "Aurora Shipping Ltd"], aliases: ["Vanya Petrov", "Aurora Shipping Limited"] }, expect: "BLOCK" },
          ],
        },
      },
      visibleTests: [
        { id: "vt1", description: "Exact sanctions-list matches are blocked", type: "execution", check: "exactBlock", weight: 15, isVisible: true },
        { id: "vt2", description: "Case, punctuation and spacing variants are still blocked", type: "execution", check: "normalisedBlock", weight: 20, isVisible: true },
        { id: "vt3", description: "Known aliases are blocked", type: "execution", check: "aliasBlock", weight: 15, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "Reordered names are sent to manual review", type: "execution", check: "reorderedReview", weight: 20, isVisible: false },
        { id: "ht2", description: "Innocent customers are not over-blocked", type: "execution", check: "innocentAllowed", weight: 15, isVisible: false },
        { id: "ht3", description: "Alias matching is normalisation-aware", type: "execution", check: "aliasNormalised", weight: 15, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `function screenPayment({ recipient, sanctions, aliases }) {
  // Normalise: lower-case, strip punctuation, collapse whitespace.
  const tokens = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\\s+/).filter(Boolean)
  const exact = (s) => tokens(s).join(" ")
  const sorted = (s) => tokens(s).sort().join(" ")

  const listed = [...sanctions, ...aliases]

  // s.4.2(1) - BLOCK: normalised match against the list or a known alias.
  for (const entry of listed) {
    if (exact(entry) === exact(recipient)) return "BLOCK"
  }

  // s.4.2(2) - REVIEW: same name parts in a different order.
  for (const entry of listed) {
    if (sorted(entry) === sorted(recipient)) return "REVIEW"
  }

  // s.4.2(3) - ALLOW: over-blocking is also a failure.
  return "ALLOW"
}`,
      explanation: "The shipped rule only blocks the exact list spelling, so 'IVAN PETROV.' or an alias sails through - a false negative that is a sanctions breach. The fix normalises names (case, punctuation, spacing) before comparing, checks the alias list, and routes reordered names to manual review rather than auto-deciding. Note what it does not do: block near-miss names like 'Ivana Petrova'. Over-blocking (de-risking) harms innocent customers and is itself a regulatory concern - the skill is encoding both duties at once.",
      tags: ["sanctions", "AML", "screening", "debug", "compliance", "executable"],
      isXrplRelated: false,
      requiresXrplTestnet: false,
      estimatedMinutes: 25,
      maxScore: 100,
    },

    // ─── AI-ASSISTED LEGAL WORK ───────────────────────────────────────────
    {
      title: "Repair an AI-Generated Escrow Clause",
      slug: "repair-ai-escrow-clause",
      trackId: trackMap["ai-assisted-legal"],
      mode: Mode.AI_ASSISTED,
      difficulty: Difficulty.INTERMEDIATE,
      description: "An AI has generated an escrow clause with multiple errors. Identify the flaws and produce a corrected version.",
      scenario: `An AI assistant was asked to draft an escrow clause for a commercial property transaction. The output contains several errors that could create significant legal and commercial risk if used without correction.\n\nYour task is to: (1) identify each error, (2) explain why it is wrong, and (3) produce a corrected clause.`,
      publicRequirements: {
        aiOutput: `ESCROW CLAUSE (AI-Generated - contains errors)\n\n1. The Buyer shall deposit the purchase price into an escrow account within 5 business days of the agreement date.\n\n2. The escrow agent shall release funds to the Seller upon receipt of a completion notice from either party.\n\n3. If the transaction does not complete within 30 days, the escrow agent shall return all funds to the Buyer without deduction.\n\n4. The escrow agent's fees shall be paid from the escrow funds before release.\n\n5. Either party may instruct the escrow agent to release funds at any time.`,
        knownErrors: [
          "Release condition is too broad - 'either party' can trigger release",
          "No dispute mechanism if completion is contested",
          "No specification of what 'completion notice' must contain",
          "30-day return period may conflict with contractual completion date",
          "Fee deduction from escrow funds before release creates ambiguity about release amount",
          "Clause 5 directly contradicts the purpose of escrow",
        ],
      },
      starterMaterial: `ESCROW CLAUSE (AI-Generated - contains errors)\n\n1. The Buyer shall deposit the purchase price into an escrow account within 5 business days of the agreement date.\n\n2. The escrow agent shall release funds to the Seller upon receipt of a completion notice from either party.\n\n3. If the transaction does not complete within 30 days, the escrow agent shall return all funds to the Buyer without deduction.\n\n4. The escrow agent's fees shall be paid from the escrow funds before release.\n\n5. Either party may instruct the escrow agent to release funds at any time.`,
      starterMaterialType: "contract",
      visibleTests: [
        { id: "vt1", description: "Clause 2 error identified (either party release)", type: "concept", concepts: ["either party", "release condition"], weight: 15, isVisible: true },
        { id: "vt2", description: "Clause 5 error identified (unilateral release)", type: "concept", concepts: ["clause 5", "unilateral", "contradict"], weight: 15, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "Dispute mechanism added to corrected clause", type: "concept", concepts: ["dispute", "deadlock", "arbitrat"], weight: 20, isVisible: false },
        { id: "ht2", description: "Completion notice defined with required content", type: "concept", concepts: ["completion notice", "defined"], weight: 15, isVisible: false },
        { id: "ht3", description: "Refund condition tied to contractual completion date, not fixed 30-day period", type: "concept", concepts: ["completion date", "contractual"], weight: 15, isVisible: false },
        { id: "ht4", description: "Fee deduction ambiguity resolved in corrected clause", type: "concept", concepts: ["fee", "deduct", "net"], weight: 10, isVisible: false },
        { id: "ht5", description: "Requires joint instruction for release", type: "concept", concepts: ["joint", "both parties", "jointly"], weight: 15, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `ERRORS IDENTIFIED:\n\n1. Clause 2: "either party" can trigger release - this removes the protection escrow provides. Should require joint written instruction or a defined completion trigger.\n\n2. Clause 5: Directly contradicts the purpose of escrow. Unilateral release renders the arrangement meaningless.\n\n3. No dispute mechanism: If parties disagree on whether completion occurred, there is no resolution path.\n\n4. "Completion notice" is undefined: Content, form, and who may issue it are not specified.\n\n5. 30-day longstop may conflict with the actual completion date in the purchase agreement.\n\n6. Fee deduction before release means the Seller receives less than the purchase price without knowing the net amount.\n\nCORRECTED CLAUSE:\n\n1. The Buyer shall deposit the purchase price into the Escrow Account within 5 Business Days of the Agreement Date.\n\n2. The Escrow Agent shall release the Escrow Funds to the Seller only upon receipt of a Joint Completion Notice, being a written notice signed by both parties confirming that completion of the transaction has occurred in accordance with the Purchase Agreement.\n\n3. If the Escrow Agent does not receive a Joint Completion Notice by the Longstop Date specified in the Purchase Agreement, it shall return the Escrow Funds to the Buyer within 5 Business Days, net of any fees payable under clause 4.\n\n4. The Escrow Agent's fees shall be borne equally by the parties and shall be paid separately and shall not be deducted from the Escrow Funds.\n\n5. In the event of a dispute between the parties as to whether completion has occurred, either party may refer the matter to [dispute resolution mechanism] and the Escrow Agent shall not release funds until the dispute is resolved.`,
      explanation: "AI-generated legal clauses frequently produce plausible but legally incorrect text. The critical skill is identifying structural errors - particularly conditions that negate the commercial purpose of the arrangement.",
      tags: ["AI", "escrow", "clause-repair", "property"],
      isXrplRelated: false,
      requiresXrplTestnet: false,
      estimatedMinutes: 25,
      maxScore: 100,
    },
    {
      title: "Improve an AI-Generated Compliance Workflow",
      slug: "improve-ai-compliance-workflow",
      trackId: trackMap["ai-assisted-legal"],
      mode: Mode.AI_ASSISTED,
      difficulty: Difficulty.ADVANCED,
      description: "An AI produced a compliance workflow for a digital asset exchange. Identify gaps, explain the risks, and produce an improved version.",
      scenario: `A digital asset exchange used an AI assistant to generate a customer onboarding compliance workflow. The workflow will be reviewed by the FCA. Your task is to identify the compliance gaps and produce an improved workflow that would satisfy UK AML regulations and the FCA's expectations for cryptoasset businesses.`,
      publicRequirements: {
        aiOutput: `Customer Onboarding Workflow (AI-Generated):\n1. Customer submits name, email, and date of birth\n2. System checks name against sanctions list\n3. If no match: account approved automatically\n4. Customer can now deposit and trade\n5. Annual review conducted by compliance team`,
        requiredStandards: ["UK Money Laundering Regulations 2017", "FCA Cryptoasset Business Registration", "JMLSG Guidance", "Travel Rule (for transfers above threshold)"],
        knownGaps: [
          "No identity document verification",
          "No proof of address",
          "No PEP screening",
          "No source of funds for high-value customers",
          "Automatic approval without human review",
          "No risk-based approach - all customers treated identically",
          "No transaction monitoring mentioned",
          "Travel Rule compliance absent",
        ],
      },
      starterMaterial: "1. Customer submits name, email, and date of birth\n2. System checks name against sanctions list\n3. If no match: account approved automatically\n4. Customer can now deposit and trade\n5. Annual review conducted by compliance team",
      starterMaterialType: "workflow",
      visibleTests: [
        { id: "vt1", description: "Identity document verification added", type: "concept", concepts: ["identity document", "passport", "photo id"], weight: 10, isVisible: true },
        { id: "vt2", description: "PEP screening added", type: "concept", concepts: ["pep", "politically exposed"], weight: 10, isVisible: true },
        { id: "vt3", description: "Automatic approval removed in favour of human review", type: "concept", concepts: ["human review", "compliance officer", "manual"], weight: 10, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "Risk-based approach implemented (different tiers)", type: "concept", concepts: ["risk-based", "risk based", "risk tier", "low risk", "high risk"], weight: 15, isVisible: false },
        { id: "ht2", description: "Source of funds required for high-value customers", type: "concept", concepts: ["source of funds", "source of wealth"], weight: 15, isVisible: false },
        { id: "ht3", description: "Transaction monitoring referenced", type: "concept", concepts: ["transaction monitoring", "ongoing monitoring"], weight: 15, isVisible: false },
        { id: "ht4", description: "Travel Rule addressed for transfers above threshold", type: "concept", concepts: ["travel rule", "originator", "beneficiary information"], weight: 15, isVisible: false },
        { id: "ht5", description: "Proof of address required", type: "concept", concepts: ["proof of address", "address verification"], weight: 10, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 65 },
      modelAnswer: `COMPLIANCE GAPS IN AI OUTPUT:\n1. No identity document verification (fails MLR 2017 Reg 28)\n2. No proof of address\n3. No PEP screening (required by MLR 2017 Reg 35)\n4. Automatic approval creates compliance liability\n5. No risk-based differentiation (required by MLR 2017 Reg 18)\n6. No source of funds for high-value customers (EDD threshold)\n7. No ongoing transaction monitoring\n8. No Travel Rule provision\n\nIMPROVED WORKFLOW:\n\nTIER 1 - ALL CUSTOMERS:\n1. Submit: full name, date of birth, nationality, email, residential address\n2. Identity verification: government photo ID (passport / driving licence)\n3. Proof of address: utility bill or bank statement (within 3 months)\n4. Sanctions screening: OFAC, UN, HMT consolidated lists\n5. PEP screening: commercial database\n6. Compliance officer review and approval (no automatic approval)\n7. Account activation on approval\n\nTIER 2 - HIGH-RISK INDICATORS (any of: PEP, high-risk jurisdiction, deposit >£10k):\n8. Enhanced Due Diligence: source of wealth, source of funds declaration\n9. Senior compliance approval required\n10. Enhanced ongoing monitoring flag applied\n\nONGOING:\n11. Transaction monitoring: automated rules + manual review triggers\n12. Travel Rule: originator/beneficiary information required for transfers above £1,000\n13. Annual review for all customers; 6-monthly for high-risk`,
      explanation: "The FCA expects cryptoasset businesses to implement a full risk-based AML framework. Automatic approval, absent identity checks, and missing transaction monitoring are the most common regulatory failure points.",
      tags: ["AI", "compliance", "FCA", "AML", "workflow", "cryptoassets"],
      isXrplRelated: false,
      requiresXrplTestnet: false,
      estimatedMinutes: 35,
      maxScore: 100,
    },

    // ─── XRPL ESCROW ─────────────────────────────────────────────────────
    {
      title: "Fix the Escrow Release Logic That Pays Before the Dispute Window",
      slug: "build-xrpl-escrow-release-logic",
      trackId: trackMap["xrpl-escrow"],
      mode: Mode.DEBUG,
      difficulty: Difficulty.BEGINNER,
      description: "The release controller for an XRPL escrow pays the seller the moment delivery is confirmed - no dispute window, no refund path, no arbitrator. Fix the code. It is executed against the deal's lifecycle scenarios and graded on the actions it actually chooses.",
      scenario: `A fintech settles buyer-seller trades with XRPL native escrow. An off-chain controller decides, at each point in the lifecycle, which action the platform takes next: submit EscrowFinish, submit EscrowCancel, wait, or escalate to the arbitrator.\n\nThe legal requirements are:\n- The buyer has 48 hours after delivery confirmation to raise a dispute.\n- If no dispute is raised within 48 hours, EscrowFinish may be submitted (silence is approval).\n- If a dispute is raised, funds remain locked and a human arbitrator is notified - never an automatic release.\n- If the seller fails to deliver within 30 days, the buyer may reclaim the funds via EscrowCancel.\n\nThe controller below pays the seller the moment delivery is confirmed. Fix nextEscrowAction so it enforces all four terms. The platform runs your code against lifecycle scenarios (including hidden boundary cases) and grades the actions it returns.`,
      publicRequirements: {
        function: 'nextEscrowAction({ deliveryConfirmed, hoursSinceDelivery, disputeOpen, daysSinceCreate }) -> "FINISH" | "CANCEL" | "WAIT" | "ESCALATE"',
        legalTerms: [
          "FINISH only after the 48-hour dispute window has closed with no dispute",
          "ESCALATE (arbitrator) whenever a dispute is open - never release automatically",
          "CANCEL (refund the buyer) once 30 days pass with no delivery",
          "WAIT in every other situation",
        ],
        note: "Your code runs in a sandbox; it must return one of the four action strings.",
      },
      starterMaterialType: "js",
      starterMaterial: `// Escrow release controller: decides the platform's next on-ledger action.
//
// LEGAL TERMS (from the signed deal):
//   1. Buyer has 48 hours after delivery confirmation to dispute.
//   2. No dispute within 48 hours -> EscrowFinish (silence is approval).
//   3. Open dispute -> funds stay locked, arbitrator decides. Never auto-release.
//   4. No delivery within 30 days -> buyer refundable via EscrowCancel.
//
// This version pays the seller the moment delivery is confirmed.
// It passed code review. Fix nextEscrowAction.
function nextEscrowAction({ deliveryConfirmed, hoursSinceDelivery, disputeOpen, daysSinceCreate }) {
  if (deliveryConfirmed) return "FINISH"
  return "WAIT"
}`,
      expectedSolution: {
        kind: "pure-function",
        entry: "nextEscrowAction",
        groups: {
          releaseAfterWindow: [
            { label: "Delivery confirmed 49h ago, no dispute", input: { deliveryConfirmed: true, hoursSinceDelivery: 49, disputeOpen: false, daysSinceCreate: 3 }, expect: "FINISH" },
          ],
          disputeWindowHolds: [
            { label: "Delivery confirmed 12h ago - window still open", input: { deliveryConfirmed: true, hoursSinceDelivery: 12, disputeOpen: false, daysSinceCreate: 1 }, expect: "WAIT" },
          ],
          disputeEscalates: [
            { label: "Dispute open after delivery - arbitrator, not auto-release", input: { deliveryConfirmed: true, hoursSinceDelivery: 60, disputeOpen: true, daysSinceCreate: 3 }, expect: "ESCALATE" },
          ],
          expiryRefund: [
            { label: "No delivery after 31 days - buyer reclaims funds", input: { deliveryConfirmed: false, hoursSinceDelivery: 0, disputeOpen: false, daysSinceCreate: 31 }, expect: "CANCEL" },
          ],
          stillWaiting: [
            { label: "No delivery yet at day 10 - keep waiting", input: { deliveryConfirmed: false, hoursSinceDelivery: 0, disputeOpen: false, daysSinceCreate: 10 }, expect: "WAIT" },
          ],
          windowBoundary: [
            { label: "Exactly 48h - window closed, release permitted", input: { deliveryConfirmed: true, hoursSinceDelivery: 48, disputeOpen: false, daysSinceCreate: 2 }, expect: "FINISH" },
            { label: "47h - window still open", input: { deliveryConfirmed: true, hoursSinceDelivery: 47, disputeOpen: false, daysSinceCreate: 2 }, expect: "WAIT" },
          ],
        },
      },
      visibleTests: [
        { id: "vt1", description: "Release is permitted once the dispute window closes", type: "execution", check: "releaseAfterWindow", weight: 15, isVisible: true },
        { id: "vt2", description: "No release while the 48-hour dispute window is open", type: "execution", check: "disputeWindowHolds", weight: 20, isVisible: true },
        { id: "vt3", description: "An open dispute escalates to the arbitrator", type: "execution", check: "disputeEscalates", weight: 15, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "Buyer is refundable after 30 days without delivery", type: "execution", check: "expiryRefund", weight: 20, isVisible: false },
        { id: "ht2", description: "Undelivered escrow inside 30 days keeps waiting", type: "execution", check: "stillWaiting", weight: 10, isVisible: false },
        { id: "ht3", description: "The 48-hour boundary is handled exactly", type: "execution", check: "windowBoundary", weight: 20, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `function nextEscrowAction({ deliveryConfirmed, hoursSinceDelivery, disputeOpen, daysSinceCreate }) {
  // Term 3: an open dispute freezes everything - the arbitrator decides.
  if (disputeOpen) return "ESCALATE"

  if (deliveryConfirmed) {
    // Terms 1-2: buyer has 48 hours to contest; silence after that is approval.
    return hoursSinceDelivery >= 48 ? "FINISH" : "WAIT"
  }

  // Term 4: no delivery within 30 days -> refund path via EscrowCancel.
  return daysSinceCreate >= 30 ? "CANCEL" : "WAIT"
}`,
      explanation: "The buggy controller collapses the whole lifecycle into 'delivered means paid'. That erases the buyer's 48-hour dispute right, routes disputed funds to the seller instead of the arbitrator, and leaves an undelivered escrow locked forever with no refund. The fix orders the checks by legal priority: dispute first (it freezes release), then the dispute window, then the 30-day refund path. On the ledger these map to EscrowFinish, EscrowCancel, or doing nothing - the legal skill is knowing which is lawful when.",
      tags: ["XRPL", "escrow", "EscrowFinish", "EscrowCancel", "dispute", "executable"],
      isXrplRelated: true,
      requiresXrplTestnet: true,
      xrplTxHash: null,
      estimatedMinutes: 20,
      maxScore: 100,
    },
    {
      title: "Fix the XRPL Payment Gate That Only Checks KYC",
      slug: "modify-xrpl-payment-compliance",
      trackId: trackMap["xrpl-compliance"],
      mode: Mode.MODIFY,
      difficulty: Difficulty.INTERMEDIATE,
      description: "The payment gate clears any XRPL payment as long as both parties passed KYC at onboarding - no sanctions check at payment time, no jurisdiction block, no threshold review. Fix the code. It is executed against payment scenarios and graded on the decisions it returns.",
      scenario: `A cross-border payments firm settles between correspondent banks on XRPL. Their gate submits a payment if both sender and recipient completed KYC at onboarding - and checks nothing else.\n\nA regulatory review requires:\n- Sanctions screening at the time of EACH payment, not just onboarding. A screening hit blocks the payment - it cannot be waved through by any approval.\n- Payments to accounts in FATF high-risk jurisdictions must be blocked.\n- Payments of $10,000 or more require manual compliance approval before the XRPL transaction is submitted.\n- Submitted payments must carry the compliance reference ID in the XRPL Memo field for traceability.\n\nFix processPayment so it enforces all of this. The platform runs your code against payment scenarios (including hidden edge cases) and grades the decisions it actually returns.`,
      publicRequirements: {
        function: 'processPayment({ senderKycApproved, recipientKycApproved, sanctionsMatch, recipientJurisdiction, highRiskJurisdictions, amountUsd, manualApproval, complianceRef }) -> decision object',
        decisions: [
          '{ action: "BLOCK", reason: "KYC_INCOMPLETE" | "SANCTIONS_MATCH" | "HIGH_RISK_JURISDICTION" }',
          '{ action: "REVIEW", reason: "ABOVE_THRESHOLD" } when $10,000+ and not yet manually approved',
          '{ action: "SUBMIT", memo: complianceRef } when every check passes',
        ],
        note: "sanctionsMatch is the real-time screening result for this payment. manualApproval is true only when compliance has already approved this payment.",
      },
      starterMaterialType: "js",
      starterMaterial: `// XRPL payment gate for correspondent-bank settlement.
//
// REGULATORY REQUIREMENTS (from the s.166 review):
//   1. Sanctions screening at EACH payment - a hit always blocks,
//      no approval can override it.
//   2. Block payments to FATF high-risk jurisdictions.
//   3. $10,000+ requires manual compliance approval before submission.
//   4. Submitted payments carry the compliance reference in the Memo.
//
// This version trusts onboarding KYC and checks nothing else.
// Fix processPayment.
function processPayment({ senderKycApproved, recipientKycApproved, complianceRef }) {
  if (!senderKycApproved || !recipientKycApproved) {
    return { action: "BLOCK", reason: "KYC_INCOMPLETE" }
  }
  return { action: "SUBMIT", memo: complianceRef }
}`,
      expectedSolution: {
        kind: "pure-function",
        entry: "processPayment",
        groups: {
          kycRetained: [
            { label: "Recipient KYC incomplete", input: { senderKycApproved: true, recipientKycApproved: false, sanctionsMatch: false, recipientJurisdiction: "DE", highRiskJurisdictions: ["IR", "KP", "MM"], amountUsd: 500, manualApproval: false, complianceRef: "REF-1001" }, expect: { action: "BLOCK", reason: "KYC_INCOMPLETE" } },
          ],
          sanctionsAtPaymentTime: [
            { label: "Screening hit at payment time (KYC passed at onboarding)", input: { senderKycApproved: true, recipientKycApproved: true, sanctionsMatch: true, recipientJurisdiction: "DE", highRiskJurisdictions: ["IR", "KP", "MM"], amountUsd: 500, manualApproval: false, complianceRef: "REF-1002" }, expect: { action: "BLOCK", reason: "SANCTIONS_MATCH" } },
          ],
          jurisdictionBlock: [
            { label: "Recipient account in a FATF high-risk jurisdiction", input: { senderKycApproved: true, recipientKycApproved: true, sanctionsMatch: false, recipientJurisdiction: "KP", highRiskJurisdictions: ["IR", "KP", "MM"], amountUsd: 500, manualApproval: false, complianceRef: "REF-1003" }, expect: { action: "BLOCK", reason: "HIGH_RISK_JURISDICTION" } },
          ],
          thresholdReview: [
            { label: "$10,000 exactly, not yet approved", input: { senderKycApproved: true, recipientKycApproved: true, sanctionsMatch: false, recipientJurisdiction: "DE", highRiskJurisdictions: ["IR", "KP", "MM"], amountUsd: 10000, manualApproval: false, complianceRef: "REF-1004" }, expect: { action: "REVIEW", reason: "ABOVE_THRESHOLD" } },
            { label: "$25,000 with manual approval granted", input: { senderKycApproved: true, recipientKycApproved: true, sanctionsMatch: false, recipientJurisdiction: "DE", highRiskJurisdictions: ["IR", "KP", "MM"], amountUsd: 25000, manualApproval: true, complianceRef: "REF-1005" }, expect: { action: "SUBMIT", memo: "REF-1005" } },
          ],
          memoTraceability: [
            { label: "Clean payment carries the compliance reference", input: { senderKycApproved: true, recipientKycApproved: true, sanctionsMatch: false, recipientJurisdiction: "FR", highRiskJurisdictions: ["IR", "KP", "MM"], amountUsd: 900, manualApproval: false, complianceRef: "REF-1006" }, expect: { action: "SUBMIT", memo: "REF-1006" } },
          ],
          approvalCannotOverrideSanctions: [
            { label: "Sanctions hit with manual approval - must still block", input: { senderKycApproved: true, recipientKycApproved: true, sanctionsMatch: true, recipientJurisdiction: "DE", highRiskJurisdictions: ["IR", "KP", "MM"], amountUsd: 20000, manualApproval: true, complianceRef: "REF-1007" }, expect: { action: "BLOCK", reason: "SANCTIONS_MATCH" } },
          ],
        },
      },
      visibleTests: [
        { id: "vt1", description: "KYC gate is retained from the original workflow", type: "execution", check: "kycRetained", weight: 15, isVisible: true },
        { id: "vt2", description: "Sanctions are screened at payment time, not just onboarding", type: "execution", check: "sanctionsAtPaymentTime", weight: 20, isVisible: true },
        { id: "vt3", description: "FATF high-risk jurisdictions are blocked", type: "execution", check: "jurisdictionBlock", weight: 15, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "$10,000+ payments require manual approval first", type: "execution", check: "thresholdReview", weight: 20, isVisible: false },
        { id: "ht2", description: "Submitted payments carry the compliance reference in the Memo", type: "execution", check: "memoTraceability", weight: 15, isVisible: false },
        { id: "ht3", description: "Manual approval cannot override a sanctions hit", type: "execution", check: "approvalCannotOverrideSanctions", weight: 15, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `function processPayment({ senderKycApproved, recipientKycApproved, sanctionsMatch, recipientJurisdiction, highRiskJurisdictions, amountUsd, manualApproval, complianceRef }) {
  // Retained: both parties must have completed KYC.
  if (!senderKycApproved || !recipientKycApproved) {
    return { action: "BLOCK", reason: "KYC_INCOMPLETE" }
  }

  // Screening runs at EVERY payment - designations change after onboarding,
  // and no approval can override a hit.
  if (sanctionsMatch) {
    return { action: "BLOCK", reason: "SANCTIONS_MATCH" }
  }

  if (highRiskJurisdictions.includes(recipientJurisdiction)) {
    return { action: "BLOCK", reason: "HIGH_RISK_JURISDICTION" }
  }

  // $10,000+ needs a human before anything touches the ledger.
  if (amountUsd >= 10000 && manualApproval !== true) {
    return { action: "REVIEW", reason: "ABOVE_THRESHOLD" }
  }

  // Traceability: the compliance reference travels in the XRPL Memo.
  return { action: "SUBMIT", memo: complianceRef }
}`,
      explanation: "The shipped gate treats onboarding KYC as permanent clearance. Sanctions designations change daily, so screening must run per payment - and the check order matters: a sanctions hit blocks even a manually-approved payment, which is why the sanctions check sits above the threshold logic rather than beside it. The Memo reference is what lets an auditor tie the on-ledger XRPL transaction back to the compliance decision that authorised it.",
      tags: ["XRPL", "compliance", "sanctions", "payments", "AML", "FATF", "executable"],
      isXrplRelated: true,
      requiresXrplTestnet: false,
      estimatedMinutes: 25,
      maxScore: 100,
    },
    {
      title: "Fix the Tokenised Bond Transfer Gate That Ignores the Lock-Up",
      slug: "design-xrpl-token-transfer-restrictions",
      trackId: trackMap["xrpl-tokenisation"],
      mode: Mode.MODIFY,
      difficulty: Difficulty.ADVANCED,
      description: "The transfer gate for a tokenised corporate bond approves any transfer to an authorised Trust Line - ignoring the 12-month lock-up, KYC, sanctions, jurisdiction limits, and the maturity condition on redemption. Fix the code. It is executed against transfer scenarios and graded on the approvals it actually grants.",
      scenario: `A UK asset manager issues a tokenised corporate bond on XRPL as an issued currency held via Trust Lines. The issuer has set RequireAuth, so only authorised Trust Lines can hold the token - but everything above that is enforced by the platform's transfer gate, and the gate below approves any transfer to an authorised line.\n\nThe bond terms and regulatory requirements:\n- Transfers are restricted for the first 12 months from issuance (lock-up period, 365 days).\n- The receiving account must hold an authorised Trust Line AND have completed the issuer's KYC.\n- Sanctions screening must pass before any transfer.\n- Accounts in FATF high-risk jurisdictions may not receive the token.\n- Redemption (returning the token to the issuer) is only available after the maturity date - but it is exempt from the lock-up and jurisdiction rules, since it is the contractual exit.\n\nFix approveTransfer. The platform runs your code against transfer and redemption scenarios (including hidden edge cases) and grades the approvals it grants.`,
      publicRequirements: {
        function: 'approveTransfer({ kind, daysSinceIssuance, maturityReached, recipientAuthorised, recipientKycComplete, sanctionsMatch, recipientJurisdiction, highRiskJurisdictions }) -> approval object',
        decisions: [
          '{ approved: true } when the transfer or redemption is permitted',
          '{ approved: false, reason: "LOCKUP_ACTIVE" | "TRUST_LINE_NOT_AUTHORISED" | "KYC_INCOMPLETE" | "SANCTIONS_MATCH" | "HIGH_RISK_JURISDICTION" | "NOT_MATURED" } otherwise',
        ],
        checkOrder: "TRANSFER: lock-up, then trust line, then KYC, then sanctions, then jurisdiction. REDEMPTION: maturity only.",
        note: 'kind is "TRANSFER" or "REDEMPTION". The lock-up is 365 days from issuance.',
      },
      starterMaterialType: "js",
      starterMaterial: `// Transfer gate for a tokenised corporate bond on XRPL.
//
// BOND TERMS AND REGULATORY REQUIREMENTS:
//   1. 12-month lock-up (365 days) from issuance - no transfers.
//   2. Recipient needs an authorised Trust Line AND completed KYC.
//   3. Sanctions screening must pass before any transfer.
//   4. FATF high-risk jurisdictions may not receive the token.
//   5. REDEMPTION (return to issuer) only after maturity - but exempt
//      from lock-up and jurisdiction rules: it is the contractual exit.
//
// This version approves anything sent to an authorised Trust Line.
// Fix approveTransfer.
function approveTransfer({ kind, recipientAuthorised }) {
  if (!recipientAuthorised) {
    return { approved: false, reason: "TRUST_LINE_NOT_AUTHORISED" }
  }
  return { approved: true }
}`,
      expectedSolution: {
        kind: "pure-function",
        entry: "approveTransfer",
        groups: {
          trustLineGate: [
            { label: "Recipient without an authorised Trust Line", input: { kind: "TRANSFER", daysSinceIssuance: 400, maturityReached: false, recipientAuthorised: false, recipientKycComplete: true, sanctionsMatch: false, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: false, reason: "TRUST_LINE_NOT_AUTHORISED" } },
          ],
          lockupEnforced: [
            { label: "Transfer on day 200 of the 365-day lock-up", input: { kind: "TRANSFER", daysSinceIssuance: 200, maturityReached: false, recipientAuthorised: true, recipientKycComplete: true, sanctionsMatch: false, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: false, reason: "LOCKUP_ACTIVE" } },
          ],
          sanctionsGate: [
            { label: "Sanctions hit on the recipient", input: { kind: "TRANSFER", daysSinceIssuance: 400, maturityReached: false, recipientAuthorised: true, recipientKycComplete: true, sanctionsMatch: true, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: false, reason: "SANCTIONS_MATCH" } },
          ],
          kycGate: [
            { label: "Recipient authorised but KYC incomplete", input: { kind: "TRANSFER", daysSinceIssuance: 400, maturityReached: false, recipientAuthorised: true, recipientKycComplete: false, sanctionsMatch: false, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: false, reason: "KYC_INCOMPLETE" } },
          ],
          jurisdictionGate: [
            { label: "Recipient in a FATF high-risk jurisdiction", input: { kind: "TRANSFER", daysSinceIssuance: 400, maturityReached: false, recipientAuthorised: true, recipientKycComplete: true, sanctionsMatch: false, recipientJurisdiction: "KP", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: false, reason: "HIGH_RISK_JURISDICTION" } },
            { label: "Clean post-lock-up transfer approved", input: { kind: "TRANSFER", daysSinceIssuance: 400, maturityReached: false, recipientAuthorised: true, recipientKycComplete: true, sanctionsMatch: false, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: true } },
          ],
          redemptionMaturity: [
            { label: "Redemption before maturity", input: { kind: "REDEMPTION", daysSinceIssuance: 200, maturityReached: false, recipientAuthorised: true, recipientKycComplete: true, sanctionsMatch: false, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: false, reason: "NOT_MATURED" } },
            { label: "Redemption after maturity (lock-up exemption applies)", input: { kind: "REDEMPTION", daysSinceIssuance: 200, maturityReached: true, recipientAuthorised: true, recipientKycComplete: true, sanctionsMatch: false, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: true } },
          ],
          lockupBoundary: [
            { label: "Day 365 exactly - lock-up has ended", input: { kind: "TRANSFER", daysSinceIssuance: 365, maturityReached: false, recipientAuthorised: true, recipientKycComplete: true, sanctionsMatch: false, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: true } },
            { label: "Day 364 - still locked", input: { kind: "TRANSFER", daysSinceIssuance: 364, maturityReached: false, recipientAuthorised: true, recipientKycComplete: true, sanctionsMatch: false, recipientJurisdiction: "GB", highRiskJurisdictions: ["IR", "KP"] }, expect: { approved: false, reason: "LOCKUP_ACTIVE" } },
          ],
        },
      },
      visibleTests: [
        { id: "vt1", description: "Unauthorised Trust Lines are rejected", type: "execution", check: "trustLineGate", weight: 10, isVisible: true },
        { id: "vt2", description: "The 12-month lock-up blocks early transfers", type: "execution", check: "lockupEnforced", weight: 20, isVisible: true },
        { id: "vt3", description: "Sanctions screening gates every transfer", type: "execution", check: "sanctionsGate", weight: 15, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "Receiving accounts must have completed issuer KYC", type: "execution", check: "kycGate", weight: 15, isVisible: false },
        { id: "ht2", description: "FATF high-risk jurisdictions cannot receive the token", type: "execution", check: "jurisdictionGate", weight: 15, isVisible: false },
        { id: "ht3", description: "Redemption is only available after maturity", type: "execution", check: "redemptionMaturity", weight: 15, isVisible: false },
        { id: "ht4", description: "The lock-up boundary lands exactly on day 365", type: "execution", check: "lockupBoundary", weight: 10, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 65 },
      modelAnswer: `function approveTransfer({ kind, daysSinceIssuance, maturityReached, recipientAuthorised, recipientKycComplete, sanctionsMatch, recipientJurisdiction, highRiskJurisdictions }) {
  // Redemption is the contractual exit: only the maturity condition applies.
  if (kind === "REDEMPTION") {
    return maturityReached ? { approved: true } : { approved: false, reason: "NOT_MATURED" }
  }

  // 12-month lock-up: no secondary transfers for 365 days from issuance.
  if (daysSinceIssuance < 365) {
    return { approved: false, reason: "LOCKUP_ACTIVE" }
  }

  // RequireAuth handles this on-ledger; the gate must agree with the ledger.
  if (!recipientAuthorised) {
    return { approved: false, reason: "TRUST_LINE_NOT_AUTHORISED" }
  }

  if (!recipientKycComplete) {
    return { approved: false, reason: "KYC_INCOMPLETE" }
  }

  if (sanctionsMatch) {
    return { approved: false, reason: "SANCTIONS_MATCH" }
  }

  if (highRiskJurisdictions.includes(recipientJurisdiction)) {
    return { approved: false, reason: "HIGH_RISK_JURISDICTION" }
  }

  return { approved: true }
}`,
      explanation: "XRPL's RequireAuth flag controls who can hold the token, but everything above that - lock-up, KYC, sanctions, jurisdiction - is platform-enforced, and the buggy gate enforced none of it. The subtleties the hidden tests catch: redemption is exempt from the lock-up (it is the contractual exit, and blocking it would trap investors), but strictly gated on maturity; and 'restricted for the first 12 months' means day 365 is the first tradable day. Getting the exemption wrong in either direction is a real drafting-to-code failure mode.",
      tags: ["XRPL", "tokenisation", "trust-lines", "bonds", "transfer-restrictions", "RequireAuth", "executable"],
      isXrplRelated: true,
      requiresXrplTestnet: false,
      estimatedMinutes: 35,
      maxScore: 100,
    },
    {
      title: "Fix the Travel Rule Memo That Over-Shares Personal Data",
      slug: "design-xrpl-crossborder-payment-compliance",
      trackId: trackMap["xrpl-payments"],
      mode: Mode.MODIFY,
      difficulty: Difficulty.INTERMEDIATE,
      description: "The remittance memo builder attaches the sender's full personal data to every XRPL payment - 'better safe than sorry'. That is a data-protection breach below the Travel Rule threshold. Fix the code. It is executed against corridor payments and graded on the memo it actually builds.",
      scenario: `A fintech runs a GBP → XRP → KES remittance corridor: a UK sending institution settles over XRPL to a Kenyan receiving institution. Each XRPL payment carries a compliance memo.\n\nThe rules the memo must encode:\n- Travel Rule: for payments ABOVE £1,000, full originator information (name, account, address, date of birth) and beneficiary information (name, account) must travel with the payment.\n- Data minimisation: AT OR BELOW £1,000, only an originator account reference may be attached. Shipping full personal data on a public ledger when the law does not require it is a data-protection breach - the memo is visible to everyone, forever.\n- Every memo carries the corridor identifier and the compliance reference.\n\nThe builder below attaches everything to every payment. Compliance called it "being thorough". The DPO calls it a reportable incident. Fix buildRemittanceMemo. The platform runs your code against corridor payments (including hidden boundary cases) and grades the memo it returns.`,
      publicRequirements: {
        function: "buildRemittanceMemo({ amountGbp, complianceRef, originator, beneficiary }) -> memo object",
        memoShapes: [
          'Above £1,000: { corridor: "GBP-KES", complianceRef, travelRule: { originator: { name, account, address, dateOfBirth }, beneficiary: { name, account } } }',
          'At or below £1,000: { corridor: "GBP-KES", complianceRef, travelRule: { originatorRef: originator.account } }',
        ],
        note: "The threshold is strictly above £1,000 - a £1,000 payment takes the minimised form.",
      },
      starterMaterialType: "js",
      starterMaterial: `// Compliance memo builder for the GBP -> XRP -> KES corridor.
//
// RULES:
//   1. Travel Rule (above £1,000): full originator (name, account,
//      address, dateOfBirth) + beneficiary (name, account) travel
//      with the payment.
//   2. Data minimisation (at or below £1,000): originator account
//      reference ONLY. XRPL memos are public forever - personal data
//      the law does not require is a data-protection breach.
//   3. Every memo: corridor "GBP-KES" + the compliance reference.
//
// This version sends everything on every payment - "better safe
// than sorry". The DPO disagrees. Fix buildRemittanceMemo.
function buildRemittanceMemo({ amountGbp, complianceRef, originator, beneficiary }) {
  return {
    corridor: "GBP-KES",
    complianceRef,
    travelRule: {
      originator: { name: originator.name, account: originator.account, address: originator.address, dateOfBirth: originator.dateOfBirth },
      beneficiary: { name: beneficiary.name, account: beneficiary.account },
    },
  }
}`,
      expectedSolution: {
        kind: "pure-function",
        entry: "buildRemittanceMemo",
        groups: {
          aboveThresholdComplete: [
            { label: "£2,500 payment carries full Travel Rule data", input: { amountGbp: 2500, complianceRef: "REM-4001", originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } }, expect: { corridor: "GBP-KES", complianceRef: "REM-4001", travelRule: { originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } } } },
          ],
          belowThresholdMinimised: [
            { label: "£400 payment must carry the account reference only", input: { amountGbp: 400, complianceRef: "REM-4002", originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } }, expect: { corridor: "GBP-KES", complianceRef: "REM-4002", travelRule: { originatorRef: "GB29NWBK60161331926819" } } },
          ],
          corridorAndRef: [
            { label: "Corridor and compliance reference always present", input: { amountGbp: 1500, complianceRef: "REM-4003", originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } }, expect: { corridor: "GBP-KES", complianceRef: "REM-4003" }, mode: "subset" },
          ],
          thresholdBoundary: [
            { label: "£1,000 exactly is NOT above the threshold - minimised form", input: { amountGbp: 1000, complianceRef: "REM-4004", originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } }, expect: { corridor: "GBP-KES", complianceRef: "REM-4004", travelRule: { originatorRef: "GB29NWBK60161331926819" } } },
            { label: "£1,000.01 crosses the threshold - full data", input: { amountGbp: 1000.01, complianceRef: "REM-4005", originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } }, expect: { corridor: "GBP-KES", complianceRef: "REM-4005", travelRule: { originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } } } },
          ],
          beneficiaryIncluded: [
            { label: "£5,000 payment includes beneficiary name and account", input: { amountGbp: 5000, complianceRef: "REM-4006", originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } }, expect: { corridor: "GBP-KES", complianceRef: "REM-4006", travelRule: { originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } } } },
          ],
          minimisationHolds: [
            { label: "£999.99 payment stays minimised", input: { amountGbp: 999.99, complianceRef: "REM-4007", originator: { name: "Amina Otieno", account: "GB29NWBK60161331926819", address: "14 Harbour Rd, London", dateOfBirth: "1988-03-14" }, beneficiary: { name: "Joseph Otieno", account: "KE-EQTY-009912" } }, expect: { corridor: "GBP-KES", complianceRef: "REM-4007", travelRule: { originatorRef: "GB29NWBK60161331926819" } } },
          ],
        },
      },
      visibleTests: [
        { id: "vt1", description: "Above £1,000 the full Travel Rule data travels with the payment", type: "execution", check: "aboveThresholdComplete", weight: 20, isVisible: true },
        { id: "vt2", description: "At or below £1,000 only the originator reference is attached", type: "execution", check: "belowThresholdMinimised", weight: 25, isVisible: true },
        { id: "vt3", description: "Corridor identifier and compliance reference are always present", type: "execution", check: "corridorAndRef", weight: 10, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "The £1,000 boundary is handled exactly (strictly above)", type: "execution", check: "thresholdBoundary", weight: 25, isVisible: false },
        { id: "ht2", description: "Beneficiary information is complete above the threshold", type: "execution", check: "beneficiaryIncluded", weight: 10, isVisible: false },
        { id: "ht3", description: "Data minimisation holds just under the threshold", type: "execution", check: "minimisationHolds", weight: 10, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 60 },
      modelAnswer: `function buildRemittanceMemo({ amountGbp, complianceRef, originator, beneficiary }) {
  const base = { corridor: "GBP-KES", complianceRef }

  // Travel Rule applies strictly ABOVE £1,000.
  if (amountGbp > 1000) {
    return {
      ...base,
      travelRule: {
        originator: { name: originator.name, account: originator.account, address: originator.address, dateOfBirth: originator.dateOfBirth },
        beneficiary: { name: beneficiary.name, account: beneficiary.account },
      },
    }
  }

  // At or below the threshold: data minimisation. XRPL memos are public
  // forever - only the account reference the rule requires goes on-chain.
  return { ...base, travelRule: { originatorRef: originator.account } }
}`,
      explanation: "The buggy builder fails in the direction engineers rarely consider: over-compliance. Above £1,000 the Travel Rule genuinely requires full originator and beneficiary data to travel with the payment - but below it, writing a customer's name, address, and date of birth into a public, permanent XRPL memo is a data-protection breach, not diligence. The fix is one threshold check that switches between the full IVMS-style payload and a minimised reference - and the hidden boundary tests check that 'above £1,000' means strictly above. Knowing what data must travel AND what data must not is the actual compliance skill.",
      tags: ["XRPL", "payments", "remittance", "cross-border", "travel-rule", "data-protection", "executable"],
      isXrplRelated: true,
      requiresXrplTestnet: false,
      estimatedMinutes: 30,
      maxScore: 100,
    },
    {
      title: "Fix the On-Ledger Credential That Leaks Personal Data",
      slug: "build-xrpl-kyc-gated-identity-workflow",
      trackId: trackMap["xrpl-identity"],
      mode: Mode.MODIFY,
      difficulty: Difficulty.ADVANCED,
      description: "The KYC credential builder writes the investor's name, date of birth, and passport number onto the XRP Ledger - public, permanent, unerasable - and never expires the credential. Fix the code. It is executed and graded on the credential object it actually builds.",
      scenario: `A regulated platform issues a tokenised money-market fund on XRPL. Only KYC-verified investors may hold it, so after KYC the platform's trusted issuer writes a credential to the investor's account using the XRPL Credentials feature. Holding a valid credential is what gates access.\n\nThe rules the credential must satisfy:\n- The ledger is public and permanent: NO personal data may appear in the credential. Identity evidence is referenced by its hash - the PII itself stays off-ledger.\n- Credentials must lapse with KYC: an Expiration must be set to the KYC date plus the validity period, so a stale KYC cannot keep granting access.\n- The credential must bind the right parties: subject account, issuer account, and the credential type "KYC".\n\nThe builder below "keeps everything the checker might need" - name, date of birth, passport number - directly in the on-ledger object, and never expires. That is a GDPR erasure-right problem no one can ever fix, because nothing can be deleted from the ledger.\n\nFix buildKycCredential. The platform runs your code and grades the credential object it returns - including checking what must NOT be in it.`,
      publicRequirements: {
        function: "buildKycCredential({ subjectAccount, issuerAccount, kycPassedAt, validityDays, evidenceHash, fullName, dateOfBirth, passportNumber }) -> credential object",
        credentialShape: '{ CredentialType: "KYC", Subject: subjectAccount, Issuer: issuerAccount, EvidenceHash: evidenceHash, Expiration: kycPassedAt + validityDays * 86400 }',
        rules: [
          "No PII fields on the ledger - the evidence hash is the only identity reference",
          "Expiration is kycPassedAt plus validityDays, in seconds",
          "The PII inputs are provided precisely so you can be tempted - leave them out",
        ],
        note: "Your code runs in a sandbox; it must return the credential object.",
      },
      starterMaterialType: "js",
      starterMaterial: `// Builds the on-ledger KYC credential for a verified investor.
//
// RULES:
//   1. The ledger is PUBLIC and PERMANENT - no personal data in the
//      credential. Identity evidence is referenced by hash only.
//   2. Credentials lapse with KYC: Expiration = kycPassedAt +
//      validityDays * 86400 (seconds).
//   3. Bind the parties: Subject, Issuer, CredentialType "KYC".
//
// This version keeps "everything the checker might need" on-ledger
// and never expires. The DPO has opened an incident.
// Fix buildKycCredential.
function buildKycCredential({ subjectAccount, issuerAccount, kycPassedAt, validityDays, evidenceHash, fullName, dateOfBirth, passportNumber }) {
  return {
    CredentialType: "KYC",
    Subject: subjectAccount,
    Issuer: issuerAccount,
    fullName,
    dateOfBirth,
    passportNumber,
    EvidenceHash: evidenceHash,
  }
}`,
      expectedSolution: {
        kind: "pure-function",
        entry: "buildKycCredential",
        groups: {
          credentialCore: [
            { label: "Credential binds subject, issuer, and type", input: { subjectAccount: "rInvestor9fBqW46yhV6DqhqawqrT2Ana", issuerAccount: "rIssuerTrustHnPZDzXn9wJv9NdSPKcVE", kycPassedAt: 1750000000, validityDays: 365, evidenceHash: "9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08", fullName: "Amara Diallo", dateOfBirth: "1990-07-22", passportNumber: "GBR-552019331" }, expect: { CredentialType: "KYC", Subject: "rInvestor9fBqW46yhV6DqhqawqrT2Ana", Issuer: "rIssuerTrustHnPZDzXn9wJv9NdSPKcVE" }, mode: "subset" },
          ],
          expirySet: [
            { label: "365-day validity expires exactly on time", input: { subjectAccount: "rInvestor9fBqW46yhV6DqhqawqrT2Ana", issuerAccount: "rIssuerTrustHnPZDzXn9wJv9NdSPKcVE", kycPassedAt: 1750000000, validityDays: 365, evidenceHash: "9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08", fullName: "Amara Diallo", dateOfBirth: "1990-07-22", passportNumber: "GBR-552019331" }, expect: { Expiration: 1781536000 }, mode: "subset" },
          ],
          noPiiOnLedger: [
            { label: "No personal data appears in the on-ledger object", input: { subjectAccount: "rInvestor9fBqW46yhV6DqhqawqrT2Ana", issuerAccount: "rIssuerTrustHnPZDzXn9wJv9NdSPKcVE", kycPassedAt: 1750000000, validityDays: 365, evidenceHash: "9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08", fullName: "Amara Diallo", dateOfBirth: "1990-07-22", passportNumber: "GBR-552019331" }, expect: {}, mode: "subset", forbidKeys: ["fullName", "dateOfBirth", "passportNumber"] },
          ],
          hashReference: [
            { label: "Identity evidence referenced by hash", input: { subjectAccount: "rInvestor9fBqW46yhV6DqhqawqrT2Ana", issuerAccount: "rIssuerTrustHnPZDzXn9wJv9NdSPKcVE", kycPassedAt: 1750000000, validityDays: 365, evidenceHash: "9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08", fullName: "Amara Diallo", dateOfBirth: "1990-07-22", passportNumber: "GBR-552019331" }, expect: { EvidenceHash: "9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08" }, mode: "subset" },
          ],
          renewalWindow: [
            { label: "90-day validity computes its own expiry", input: { subjectAccount: "rInvestor9fBqW46yhV6DqhqawqrT2Ana", issuerAccount: "rIssuerTrustHnPZDzXn9wJv9NdSPKcVE", kycPassedAt: 1750000000, validityDays: 90, evidenceHash: "9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08", fullName: "Amara Diallo", dateOfBirth: "1990-07-22", passportNumber: "GBR-552019331" }, expect: { Expiration: 1757776000 }, mode: "subset" },
          ],
          noPiiVariants: [
            { label: "PII does not reappear under other field names", input: { subjectAccount: "rInvestor9fBqW46yhV6DqhqawqrT2Ana", issuerAccount: "rIssuerTrustHnPZDzXn9wJv9NdSPKcVE", kycPassedAt: 1750000000, validityDays: 365, evidenceHash: "9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08", fullName: "Amara Diallo", dateOfBirth: "1990-07-22", passportNumber: "GBR-552019331" }, expect: {}, mode: "subset", forbidKeys: ["FullName", "DateOfBirth", "PassportNumber", "name", "dob", "passport"] },
          ],
        },
      },
      visibleTests: [
        { id: "vt1", description: "Credential binds subject, issuer, and the KYC type", type: "execution", check: "credentialCore", weight: 15, isVisible: true },
        { id: "vt2", description: "Credential expires when the KYC validity lapses", type: "execution", check: "expirySet", weight: 20, isVisible: true },
        { id: "vt3", description: "No personal data is written to the ledger", type: "execution", check: "noPiiOnLedger", weight: 25, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "Identity evidence is referenced by hash only", type: "execution", check: "hashReference", weight: 15, isVisible: false },
        { id: "ht2", description: "Expiry follows the validity period, not a constant", type: "execution", check: "renewalWindow", weight: 15, isVisible: false },
        { id: "ht3", description: "PII stays off-ledger under any field name", type: "execution", check: "noPiiVariants", weight: 10, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 65 },
      modelAnswer: `function buildKycCredential({ subjectAccount, issuerAccount, kycPassedAt, validityDays, evidenceHash }) {
  return {
    CredentialType: "KYC",
    Subject: subjectAccount,
    Issuer: issuerAccount,
    // The ledger is public and permanent: identity evidence goes on-chain
    // as a hash reference only. The PII stays in the off-ledger KYC store.
    EvidenceHash: evidenceHash,
    // Credentials lapse with KYC - a stale review cannot keep granting
    // access. Renewal issues a fresh credential after re-screening.
    Expiration: kycPassedAt + validityDays * 86400,
  }
}`,
      explanation: "Two failures hide in the original. First, writing name, date of birth, and passport number into an XRPL object publishes them permanently - the GDPR right to erasure cannot be honoured on an append-only ledger, so the only compliant design keeps PII off-chain and anchors it by hash. Second, a credential without an Expiration outlives the KYC review it attests to, so access persists after the verification has gone stale. The model answer simply refuses the PII inputs - the deepest fix in legal engineering is often what you leave out.",
      tags: ["XRPL", "identity", "DID", "credentials", "KYC", "privacy", "GDPR", "executable"],
      isXrplRelated: true,
      requiresXrplTestnet: false,
      estimatedMinutes: 30,
      maxScore: 100,
    },

    // ─── XRPL ESCROW (EXECUTABLE / CODE) ─────────────────────────────────
    // Flagship code challenge: the candidate fixes real xrpl.js logic. The
    // submission runs their code and grades the actual XRPL transaction it
    // produces; with XRPL_LIVE_GRADING enabled it is submitted to Testnet.
    {
      title: "Fix the Escrow That Passes Code Review but Fails Compliance",
      slug: "fix-xrpl-escrow-compliance-bug",
      trackId: trackMap["xrpl-escrow"],
      mode: Mode.MODIFY,
      difficulty: Difficulty.INTERMEDIATE,
      description: "A working xrpl.js escrow builder compiles cleanly but breaks the deal's legal terms. Find and fix the compliance bug in the code. Your code is executed and graded on the XRPL transaction it produces.",
      scenario: `A fintech is settling a cross-border trade with XRPL native escrow. The buyer locks XRP; the seller is paid once delivery is confirmed.\n\nThe signed deal terms require:\n- The seller may be paid ONLY AFTER a 48-hour dispute window (the buyer can contest delivery in that time).\n- If the seller never delivers, the buyer MUST be refundable after 30 days.\n\nA developer has written an EscrowCreate builder in xrpl.js. It compiles, it produces a syntactically valid transaction, and it would pass a normal code review. But a compliance reviewer should reject it.\n\nYour job: find what is legally wrong and fix the code so the escrow actually enforces the deal terms. Edit the buildEscrow function. The platform runs your code and inspects the XRPL transaction it builds (and, when live grading is on, submits it to XRPL Testnet to confirm the ledger accepts the valid path and rejects a premature release).`,
      publicRequirements: {
        function: "buildEscrow({ destination, amountXrp, now }) -> EscrowCreate transaction",
        legalTerms: [
          "Release only permitted after a 48-hour dispute window",
          "Buyer refundable if the seller fails to deliver within 30 days",
        ],
        helpers: { now: "current time in Ripple-epoch seconds", "drops(xrp)": "converts XRP to drops" },
        note: "Your code is executed in a sandbox; it must return a transaction object.",
      },
      starterMaterialType: "xrpl-js",
      starterMaterial: `// Cross-border conditional payment using XRPL native escrow.
//
// LEGAL TERMS (from the signed deal):
//   1. The seller may be paid ONLY AFTER a 48-hour dispute window.
//   2. If the seller never delivers, the buyer must be refundable after 30 days.
//
// Helpers available to you:
//   now          current time in Ripple-epoch seconds
//   drops(xrp)   converts XRP to drops (string)
//
// This compiles and returns a valid EscrowCreate - but compliance should
// reject it. Fix buildEscrow so it enforces BOTH legal terms.
function buildEscrow({ destination, amountXrp, now }) {
  return {
    TransactionType: "EscrowCreate",
    Amount: drops(amountXrp),
    Destination: destination,
    // TODO: encode the 48-hour dispute window and the 30-day refund path.
  }
}`,
      expectedSolution: {
        kind: "xrpl-escrow",
        entry: "buildEscrow",
        input: { destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", amountXrp: 100 },
        expect: { finishAfterSeconds: 172800, cancelAfterSeconds: 2592000, toleranceSeconds: 600 },
      },
      visibleTests: [
        { id: "vt1", description: "EscrowCreate is well-formed and accepted by the ledger", type: "execution", check: "createWellFormed", weight: 20, isVisible: true },
        { id: "vt2", description: "48-hour dispute window is encoded (FinishAfter)", type: "execution", check: "disputeWindow", weight: 20, isVisible: true },
        { id: "vt3", description: "30-day expiry refund path is enabled (CancelAfter)", type: "execution", check: "expiryRefund", weight: 15, isVisible: true },
      ],
      hiddenTests: [
        { id: "ht1", description: "A premature release is rejected by the protocol", type: "execution", check: "prematureFinishRejected", weight: 25, isVisible: false },
        { id: "ht2", description: "Refund window opens strictly after the dispute window", type: "execution", check: "windowOrdering", weight: 10, isVisible: false },
        { id: "ht3", description: "Payment amount and destination are preserved", type: "execution", check: "valuePreserved", weight: 10, isVisible: false },
      ],
      scoringRubric: { totalWeight: 100, passMark: 70 },
      modelAnswer: `function buildEscrow({ destination, amountXrp, now }) {
  const HOUR = 3600
  const DAY = 24 * HOUR
  return {
    TransactionType: "EscrowCreate",
    Amount: drops(amountXrp),
    Destination: destination,
    // Release only permitted after the 48-hour dispute window closes:
    FinishAfter: now + 48 * HOUR,
    // Buyer refundable if the seller has not delivered within 30 days:
    CancelAfter: now + 30 * DAY,
  }
}`,
      explanation: "The original code omits FinishAfter and CancelAfter. Without FinishAfter, an EscrowFinish can release funds immediately - there is no dispute window, so the buyer's contractual right to contest delivery is unenforceable. Without CancelAfter, a non-delivering seller leaves the buyer's funds locked forever with no refund path. A developer sees valid code; a legal engineer sees that the protocol is not encoding the deal's obligations. The fix adds both time bounds (with CancelAfter strictly after FinishAfter, which the ledger also requires).",
      tags: ["XRPL", "escrow", "EscrowCreate", "code", "compliance", "executable"],
      isXrplRelated: true,
      requiresXrplTestnet: true,
      estimatedMinutes: 25,
      maxScore: 100,
    },
  ]

  for (const ch of challenges) {
    // update mirrors create so content fixes to existing challenges actually
    // apply on redeploy (update: {} would leave stale rows in place forever).
    // published defaults to true; a challenge can opt out (retired content).
    await prisma.challenge.upsert({
      where: { slug: ch.slug },
      update: { ...ch },
      create: {
        published: true,
        ...ch,
      },
    })
  }

  // --- Demo leaderboard ---------------------------------------------------
  // Synthetic candidates so the leaderboard shows what a populated, popular
  // product looks like. All flagged with organisation "Demo Cohort" and a
  // demo_ clerkId prefix so they are obviously not real accounts and can be
  // cleared in one query. Idempotent via upsert.
  const trackBySlug = new Map((await prisma.track.findMany()).map((t) => [t.slug, t]))

  const demoCandidates: {
    clerkId: string
    name: string
    email: string
    progress: { slug: string; totalScore: number; completed: number }[]
  }[] = [
    { clerkId: "demo_lead_01", name: "Amara Okafor", email: "amara.okafor@demo.clauselab.io", progress: [
      { slug: "xrpl-payments", totalScore: 285, completed: 3 },
      { slug: "xrpl-escrow", totalScore: 274, completed: 3 },
      { slug: "compliance-risk", totalScore: 188, completed: 2 },
    ] },
    { clerkId: "demo_lead_02", name: "Yusuf Rahman", email: "yusuf.rahman@demo.clauselab.io", progress: [
      { slug: "xrpl-compliance", totalScore: 268, completed: 3 },
      { slug: "xrpl-payments", totalScore: 246, completed: 3 },
      { slug: "legal-engineering", totalScore: 171, completed: 2 },
    ] },
    { clerkId: "demo_lead_03", name: "Mei-Ling Chen", email: "meiling.chen@demo.clauselab.io", progress: [
      { slug: "xrpl-tokenisation", totalScore: 259, completed: 3 },
      { slug: "xrpl-identity", totalScore: 233, completed: 3 },
      { slug: "ai-assisted-legal", totalScore: 162, completed: 2 },
    ] },
    { clerkId: "demo_lead_04", name: "Tomás Herrera", email: "tomas.herrera@demo.clauselab.io", progress: [
      { slug: "xrpl-escrow", totalScore: 242, completed: 3 },
      { slug: "compliance-risk", totalScore: 197, completed: 2 },
    ] },
    { clerkId: "demo_lead_05", name: "Priya Nair", email: "priya.nair@demo.clauselab.io", progress: [
      { slug: "xrpl-payments", totalScore: 231, completed: 3 },
      { slug: "legal-engineering", totalScore: 184, completed: 2 },
    ] },
    { clerkId: "demo_lead_06", name: "Daniel Kovač", email: "daniel.kovac@demo.clauselab.io", progress: [
      { slug: "compliance-risk", totalScore: 216, completed: 3 },
      { slug: "xrpl-identity", totalScore: 158, completed: 2 },
    ] },
    { clerkId: "demo_lead_07", name: "Sofia Almeida", email: "sofia.almeida@demo.clauselab.io", progress: [
      { slug: "xrpl-tokenisation", totalScore: 205, completed: 2 },
      { slug: "xrpl-payments", totalScore: 161, completed: 2 },
    ] },
    { clerkId: "demo_lead_08", name: "Kwame Mensah", email: "kwame.mensah@demo.clauselab.io", progress: [
      { slug: "ai-assisted-legal", totalScore: 192, completed: 2 },
      { slug: "legal-engineering", totalScore: 149, completed: 2 },
    ] },
    { clerkId: "demo_lead_09", name: "Hannah Schmidt", email: "hannah.schmidt@demo.clauselab.io", progress: [
      { slug: "xrpl-compliance", totalScore: 178, completed: 2 },
    ] },
    { clerkId: "demo_lead_10", name: "Ravi Deshpande", email: "ravi.deshpande@demo.clauselab.io", progress: [
      { slug: "xrpl-escrow", totalScore: 164, completed: 2 },
    ] },
    { clerkId: "demo_lead_11", name: "Clara Dubois", email: "clara.dubois@demo.clauselab.io", progress: [
      { slug: "legal-engineering", totalScore: 142, completed: 2 },
    ] },
    { clerkId: "demo_lead_12", name: "Omar Haddad", email: "omar.haddad@demo.clauselab.io", progress: [
      { slug: "xrpl-payments", totalScore: 128, completed: 1 },
    ] },
  ]

  for (const cand of demoCandidates) {
    const user = await prisma.user.upsert({
      where: { clerkId: cand.clerkId },
      update: { name: cand.name, organisation: "Demo Cohort" },
      create: { clerkId: cand.clerkId, name: cand.name, email: cand.email, organisation: "Demo Cohort" },
    })
    for (const pr of cand.progress) {
      const track = trackBySlug.get(pr.slug)
      if (!track) continue
      await prisma.userProgress.upsert({
        where: { userId_trackId: { userId: user.id, trackId: track.id } },
        update: { totalScore: pr.totalScore, challengesCompleted: pr.completed },
        create: {
          userId: user.id,
          trackId: track.id,
          totalScore: pr.totalScore,
          challengesCompleted: pr.completed,
          averageScore: Math.round(pr.totalScore / pr.completed),
          hiddenTestPassRate: 0.7,
          xrplReadiness: pr.slug.startsWith("xrpl-") ? 78 : 0,
        },
      })
    }
  }

  console.log(`Seeded ${tracks.length} tracks, ${challenges.length} challenges, and ${demoCandidates.length} demo leaderboard candidates.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
