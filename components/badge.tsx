import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "green" | "amber" | "red" | "blue" | "purple" | "gray"
  className?: string
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      {
        "bg-gray-800 text-gray-300": variant === "default",
        "bg-emerald-900/50 text-emerald-400 border border-emerald-800": variant === "green",
        "bg-amber-900/50 text-amber-400 border border-amber-800": variant === "amber",
        "bg-red-900/50 text-red-400 border border-red-800": variant === "red",
        "bg-blue-900/50 text-blue-400 border border-blue-800": variant === "blue",
        "bg-purple-900/50 text-purple-400 border border-purple-800": variant === "purple",
        "bg-[#1e1e1e] text-gray-400 border border-[#2a2a2a]": variant === "gray",
      },
      className
    )}>
      {children}
    </span>
  )
}
