import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number, max: number): string {
  return `${score}/${max}`
}

export function scorePercent(score: number, max: number): number {
  if (max === 0) return 0
  return Math.round((score / max) * 100)
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "BEGINNER": return "text-emerald-400"
    case "INTERMEDIATE": return "text-amber-400"
    case "ADVANCED": return "text-orange-400"
    case "EXPERT": return "text-red-400"
    default: return "text-gray-400"
  }
}

export function modeLabel(mode: string): string {
  switch (mode) {
    case "BUILD": return "Build"
    case "MODIFY": return "Modify"
    case "DEBUG": return "Debug"
    case "OPTIMISE": return "Optimise"
    case "AUDIT": return "Audit"
    case "AI_ASSISTED": return "AI-Assisted"
    default: return mode
  }
}

export function difficultyLabel(difficulty: string): string {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase()
}
