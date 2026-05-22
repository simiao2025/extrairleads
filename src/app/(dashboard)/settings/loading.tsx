export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none z-0" />
      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-zinc-800/60 rounded-lg animate-pulse" />
              <div className="h-8 w-48 bg-zinc-800/50 rounded-xl animate-pulse" />
            </div>
            <div className="h-4 w-64 bg-zinc-800/30 rounded animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-zinc-800 rounded-2xl p-6 shadow-xl h-[400px] animate-pulse">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-zinc-800/60 rounded-xl" />
                <div>
                  <div className="h-5 w-40 bg-zinc-800/60 rounded mb-1" />
                  <div className="h-3 w-64 bg-zinc-800/30 rounded" />
                </div>
              </div>
              <div className="w-full h-12 bg-zinc-900 rounded-lg mb-6" />
              <div className="w-full h-32 bg-zinc-900/50 rounded-xl" />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-card border border-zinc-800 rounded-2xl p-6 shadow-xl h-[300px] animate-pulse">
               <div className="h-6 w-48 bg-zinc-800/50 rounded mb-6" />
               <div className="space-y-4">
                 <div className="h-16 w-full bg-zinc-900 rounded-lg" />
                 <div className="h-16 w-full bg-zinc-900 rounded-lg" />
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
