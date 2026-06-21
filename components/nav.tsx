"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton, useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/challenges", label: "Challenges" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
]

export function Nav() {
  const pathname = usePathname()
  const { isSignedIn } = useUser()

  return (
    <header className="border-b border-[#1e1e1e] bg-[#0a0a0a] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-semibold text-sm tracking-tight text-white flex items-center gap-2">
            <span className="text-blue-500 font-mono font-bold">&lt;/&gt;</span>
            ClauseRank
          </Link>
          {isSignedIn && (
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={cn("px-3 py-1 rounded text-sm transition-colors",
                    pathname.startsWith(link.href)
                      ? "bg-[#1e1e1e] text-white"
                      : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]"
                  )}>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
              <Link href="/sign-up" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors">Get started</Link>
            </>
          ) : (
            <>
              <Link href="/admin" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Admin</Link>
              <UserButton />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
