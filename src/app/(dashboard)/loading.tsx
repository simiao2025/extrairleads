import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-12 relative overflow-hidden">
      {/* Background Effect */}
      <div className="fixed inset-0 bg-cyber-grid pointer-events-none z-0 opacity-20" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="mx-auto max-w-[1400px] space-y-10 px-4 py-10 md:px-8 relative z-10">
        
        {/* Header Skeleton */}
        <section className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-5 max-w-2xl w-full">
            <div className="h-6 w-32 bg-zinc-800/50 rounded-full animate-pulse" />
            <div className="h-16 w-3/4 bg-zinc-800/40 rounded-xl animate-pulse" />
            <div className="h-4 w-1/2 bg-zinc-800/30 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-zinc-800/50 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-emerald-500/10 rounded-lg animate-pulse" />
          </div>
        </section>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-5 animate-pulse flex flex-col justify-end">
              <div className="h-3 w-16 bg-zinc-800/80 mb-2 rounded" />
              <div className="h-8 w-24 bg-zinc-800/60 rounded" />
            </div>
          ))}
        </div>

        {/* Kanban Board Skeleton */}
        <div className="mt-12 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 animate-pulse" />
            <div className="h-6 w-40 bg-zinc-800/50 rounded-md animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[60vh] bg-zinc-900/30 rounded-2xl border border-zinc-800/40 p-4">
                <div className="h-5 w-24 bg-zinc-800/60 mb-6 rounded animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3].map((card) => (
                    <div key={card} className="h-24 bg-zinc-800/30 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
