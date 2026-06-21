import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Nav } from "@/components/nav"
import { ChallengeWorkspace } from "@/components/challenge-workspace"
import { fetchLedgerInfo } from "@/lib/xrpl"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ChallengePage({ params }: Props) {
  const { slug } = await params

  const challenge = await db.challenge.findUnique({
    where: { slug, published: true },
    include: { track: true },
  })

  if (!challenge) notFound()

  let ledgerInfo = null
  if (challenge.requiresXrplTestnet) {
    ledgerInfo = await fetchLedgerInfo()
  }

  const safeChallenge = {
    ...challenge,
    hiddenTests: [],
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Nav />
      <ChallengeWorkspace
        challenge={safeChallenge as any}
        ledgerInfo={ledgerInfo}
        isXrpl={challenge.isXrplRelated}
      />
    </div>
  )
}
