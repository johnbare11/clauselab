import Link from "next/link"
import { Nav } from "@/components/nav"
import { Badge } from "@/components/badge"

const xrplTracks = [
  { name: "XRPL Payments", slug: "xrpl-payments", icon: "💸", desc: "Settlement, remittances, cross-border flows" },
  { name: "XRPL Escrow", slug: "xrpl-escrow", icon: "🔐", desc: "Conditional release, dispute windows, expiry" },
  { name: "XRPL Compliance", slug: "xrpl-compliance", icon: "🏦", desc: "KYC/AML controls and sanctions on-chain" },
  { name: "XRPL Tokenisation", slug: "xrpl-tokenisation", icon: "🪙", desc: "Trust lines, transfer restrictions, redemption" },
  { name: "XRPL Identity", slug: "xrpl-identity", icon: "🪪", desc: "Digital identity and KYC-gated access" },
]

const generalTracks = [
  { name: "Legal Engineering", slug: "legal-engineering", icon: "⚖️", desc: "Contract logic, state machines, obligation mapping" },
  { name: "Compliance & Risk", slug: "compliance-risk", icon: "🛡️", desc: "AML, KYC, sanctions, governance workflows" },
  { name: "AI-Assisted Legal Work", slug: "ai-assisted-legal", icon: "🤖", desc: "Review and repair AI-generated legal output" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <section className="border-b border-[#1e1e1e] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-400 font-mono uppercase tracking-widest">XRPL Ecosystem Infrastructure</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight tracking-tight">
            The assessment layer for<br />
            <span className="text-blue-400">XRPL institutional adoption.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mb-8 leading-relaxed">
            Legal, compliance, and fintech professionals prove they can translate legal intent into executable XRPL logic.
            Challenge-based. Hidden test cases. Live Testnet scenarios.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/sign-up" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded text-sm font-medium transition-colors">Start free</Link>
            <Link href="/challenges" className="border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-300 px-5 py-2 rounded text-sm transition-colors">Browse challenges</Link>
          </div>
          <p className="text-xs text-gray-600 mt-4">HackerRank-style assessment · XRPL Testnet integration · Hidden test scoring</p>
        </div>
      </section>

      <section className="border-b border-[#1e1e1e] py-12 px-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: "🏛️", title: "The institutional gap", body: "Banks and asset managers want to adopt XRPL. They cannot find professionals who can verify that XRPL workflows match their legal obligations." },
            { icon: "⚠️", title: "No standard benchmark", body: "Software engineers have HackerRank. Legal-tech professionals have nothing. There is no way to assess XRPL compliance competence." },
            { icon: "✓", title: "ClauseLab closes it", body: "Realistic scenarios. Hidden test cases. Live Testnet data. A score that tells a bank or XRPL issuer whether a candidate can do the work." },
          ].map((item) => (
            <div key={item.title}>
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-[#1e1e1e] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs text-blue-400 font-mono uppercase tracking-widest mb-1">Featured</div>
              <h2 className="text-xl font-semibold text-white">XRPL Assessment Tracks</h2>
            </div>
            <Link href="/challenges" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {xrplTracks.map((track) => (
              <Link key={track.slug} href={`/challenges?track=${track.slug}`}
                className="border border-[#1e1e1e] hover:border-blue-900/60 bg-[#0d0d0d] hover:bg-[#0a0f1a] rounded p-4 transition-all group">
                <div className="text-2xl mb-2">{track.icon}</div>
                <div className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors mb-1">{track.name}</div>
                <div className="text-gray-600 text-xs leading-relaxed">{track.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#1e1e1e] py-12 px-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Example challenge</div>
          <div className="border border-[#1e1e1e] rounded overflow-hidden">
            <div className="border-b border-[#1e1e1e] px-4 py-3 flex items-center justify-between bg-[#0d0d0d]">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white font-medium text-sm">Build XRPL Escrow Release Logic</span>
                <Badge variant="blue">Build</Badge>
                <Badge variant="green">Beginner</Badge>
                <Badge variant="gray">XRPL Escrow</Badge>
              </div>
              <Link href="/sign-up" className="text-xs text-blue-400 hover:text-blue-300 shrink-0">Try it →</Link>
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1e1e1e]">
              <div className="p-4">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Scenario</div>
                <p className="text-gray-300 text-sm leading-relaxed">A fintech company wants to use XRPL native escrow for conditional payment release. Design the complete workflow: EscrowCreate, 48-hour dispute window, EscrowFinish on approval, and EscrowCancel on 30-day expiry.</p>
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Test Cases</div>
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1.5">Visible</div>
                  <div className="text-xs text-emerald-400 font-mono space-y-1">
                    <div>✓ EscrowCreate used to lock funds</div>
                    <div>✓ EscrowFinish used for successful release</div>
                    <div>✓ 48-hour dispute window specified</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Hidden (revealed after submission)</div>
                  <div className="text-xs text-gray-600 font-mono space-y-1">
                    <div>▪ EscrowCancel handles 30-day expiry</div>
                    <div>▪ Off-chain delivery connects to on-chain release</div>
                    <div>▪ Dispute path prevents auto EscrowFinish</div>
                    <div>▪ + 2 more edge cases</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#1e1e1e] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-white mb-6">All Assessment Tracks</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {generalTracks.map((track) => (
              <Link key={track.slug} href={`/challenges?track=${track.slug}`}
                className="border border-[#1e1e1e] hover:border-[#2a2a2a] bg-[#0d0d0d] rounded p-4 transition-all">
                <div className="text-2xl mb-2">{track.icon}</div>
                <div className="text-white text-sm font-medium mb-1">{track.name}</div>
                <div className="text-gray-600 text-xs leading-relaxed">{track.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#1e1e1e] py-12 px-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs text-blue-400 font-mono uppercase tracking-widest mb-1">For employers</div>
          <h2 className="text-xl font-semibold text-white mb-2">Assess candidates the way HackerRank assesses engineers</h2>
          <p className="text-gray-500 text-sm max-w-2xl mb-8 leading-relaxed">
            Send a real XRPL or compliance scenario to a candidate, and get back an objective,
            hidden-test-graded score instead of a CV and a hunch.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { step: "1", title: "Pick a challenge set", body: "Choose from the library or author your own scenarios mapped to the role you're hiring for." },
              { step: "2", title: "Send an invite link", body: "Share a link with the candidate. No account setup or installation on their side." },
              { step: "3", title: "Review scored results", body: "See visible and hidden test results, missed requirements, and a benchmarked score." },
            ].map((s) => (
              <div key={s.step} className="border border-[#1e1e1e] rounded p-4 bg-[#0d0d0d]">
                <div className="text-blue-400 font-mono text-sm mb-2">{s.step}</div>
                <div className="text-white text-sm font-medium mb-1">{s.title}</div>
                <div className="text-gray-600 text-xs leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">See employer pricing →</Link>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-white mb-3">Built for law firms, banks, and digital asset companies</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-lg mx-auto">Identify professionals who can work with XRPL infrastructure, verify compliance logic, and translate legal intent into executable systems.</p>
          <Link href="/sign-up" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded text-sm font-medium transition-colors">Start free - no credit card required</Link>
        </div>
      </section>

      <footer className="border-t border-[#1e1e1e] py-6 px-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>ClauseLab · Assessment infrastructure for the XRPL ecosystem</span>
          <span>For education and assessment only. Not legal advice. All scenarios are synthetic.</span>
        </div>
      </footer>
    </div>
  )
}
