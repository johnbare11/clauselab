import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div>
        <div className="text-center mb-6">
          <span className="text-blue-500 font-mono font-bold text-2xl">&lt;/&gt;</span>
          <span className="text-white font-semibold text-xl ml-2">ClauseRank</span>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
