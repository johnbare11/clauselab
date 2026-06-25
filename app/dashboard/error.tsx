"use client"

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="border border-red-800 rounded p-8 max-w-2xl w-full mx-4">
        <h1 className="text-red-400 text-sm font-mono mb-2">Dashboard error</h1>
        <p className="text-white text-sm font-mono mb-4 break-all">{error.message}</p>
        {error.digest && (
          <p className="text-gray-500 text-xs font-mono">digest: {error.digest}</p>
        )}
        <pre className="text-gray-400 text-xs mt-4 overflow-auto max-h-60 whitespace-pre-wrap">
          {error.stack}
        </pre>
      </div>
    </div>
  )
}
