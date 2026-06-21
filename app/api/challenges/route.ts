import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, trackSlug, mode, difficulty, description, scenario, publicRequirements,
    starterMaterial, visibleTests, hiddenTests, scoringRubric, modelAnswer, explanation,
    tags, isXrplRelated, requiresXrplTestnet, estimatedMinutes, maxScore } = body

  const track = await db.track.findUnique({ where: { slug: trackSlug } })
  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 })

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now()

  const challenge = await db.challenge.create({
    data: {
      title,
      slug,
      trackId: track.id,
      mode,
      difficulty,
      description,
      scenario,
      publicRequirements,
      starterMaterial: starterMaterial || null,
      visibleTests,
      hiddenTests,
      scoringRubric,
      modelAnswer,
      explanation,
      tags: tags || [],
      isXrplRelated: isXrplRelated || false,
      requiresXrplTestnet: requiresXrplTestnet || false,
      estimatedMinutes: estimatedMinutes || 20,
      maxScore: maxScore || 100,
      published: true,
    },
  })

  return NextResponse.json({ id: challenge.id, slug: challenge.slug })
}
