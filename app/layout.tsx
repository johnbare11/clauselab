import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ClauseLab - Legal Engineering & XRPL Assessment",
  description: "The assessment layer for XRPL institutional adoption. Train and certify legal, compliance, and fintech professionals on real-world digital asset scenarios.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
        <body className="min-h-full bg-[#0f0f0f] text-gray-100 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
