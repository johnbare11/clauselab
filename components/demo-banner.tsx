export function DemoBanner() {
  return (
    <div className="border-b border-amber-900/40 bg-amber-950/20 px-4 py-2">
      <div className="max-w-6xl mx-auto flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-amber-500/80 font-mono">Demo mode</span>
        <span className="text-xs text-amber-200/70">
          Admin is open to all signed-in accounts for evaluation. In production this is restricted to ADMIN-role users.
        </span>
      </div>
    </div>
  )
}
