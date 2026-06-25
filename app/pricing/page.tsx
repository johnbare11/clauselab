import { Nav } from "@/components/nav"
import { Badge } from "@/components/badge"
import Link from "next/link"

export const metadata = {
  title: "Pricing - ClauseLab",
}

const tiers = [
  {
    name: "Candidate",
    plan: "FREE",
    price: "Free",
    cadence: "forever",
    tagline: "For professionals proving their XRPL and compliance skills.",
    cta: { label: "Start free", href: "/sign-up" },
    highlight: false,
    features: [
      "Full access to public challenge library",
      "Visible + hidden test scoring",
      "Personal dashboard & track progress",
      "Public leaderboard ranking",
      "Shareable verified score profile",
    ],
  },
  {
    name: "Team",
    plan: "PRO",
    price: "£249",
    cadence: "per month",
    tagline: "For hiring teams running structured technical assessments.",
    cta: { label: "Start 14-day trial", href: "/sign-up" },
    highlight: true,
    features: [
      "Everything in Candidate",
      "Send assessments to candidates via invite link",
      "Employer dashboard with candidate results",
      "Custom challenge sets per role",
      "Hidden-test analytics & benchmarking",
      "Up to 50 assessments / month",
    ],
  },
  {
    name: "Enterprise",
    plan: "ENTERPRISE",
    price: "Custom",
    cadence: "annual",
    tagline: "For banks, law firms and XRPL issuers hiring at scale.",
    cta: { label: "Contact sales", href: "/sign-up" },
    highlight: false,
    features: [
      "Everything in Team",
      "Unlimited assessments & seats",
      "Private, white-labelled challenge authoring",
      "ATS / HRIS integration",
      "SSO & audit logging",
      "Dedicated success manager & SLA",
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <section className="border-b border-[#1e1e1e] py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs text-blue-400 font-mono uppercase tracking-widest mb-3">Pricing</div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Free for candidates. Paid for the teams hiring them.</h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Candidates build a verified track record at no cost. Employers pay to assess,
            benchmark and shortlist XRPL-ready legal and compliance talent.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div key={tier.name}
              className={`rounded-lg border p-6 flex flex-col ${tier.highlight ? "border-blue-700/60 bg-[#0a0f1a]" : "border-[#1e1e1e] bg-[#0d0d0d]"}`}>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-semibold">{tier.name}</h2>
                {tier.highlight && <Badge variant="blue">Most popular</Badge>}
              </div>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed min-h-[32px]">{tier.tagline}</p>
              <div className="mb-5">
                <span className="text-3xl font-bold text-white font-mono">{tier.price}</span>
                <span className="text-gray-600 text-xs ml-2">{tier.cadence}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="text-gray-300 text-xs flex gap-2 leading-relaxed">
                    <span className="text-blue-400 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={tier.cta.href}
                className={`text-center text-sm px-4 py-2 rounded transition-colors font-medium ${tier.highlight ? "bg-blue-600 hover:bg-blue-500 text-white" : "border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-200"}`}>
                {tier.cta.label}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-600 mt-8 max-w-xl mx-auto">
          Pricing shown is indicative for evaluation. All scenarios are synthetic and for assessment only - not legal advice.
        </p>
      </section>
    </div>
  )
}
