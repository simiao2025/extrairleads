import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LeadsLoading() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 pt-12">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white pointer-events-none">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Gerenciar Leads</h1>
                <Skeleton className="h-4 w-32 mt-1 bg-zinc-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 bg-zinc-900 rounded-xl" />
          <div className="flex items-center gap-2 overflow-x-hidden">
             <Skeleton className="h-9 w-24 bg-zinc-900 rounded-full" />
             <Skeleton className="h-9 w-24 bg-zinc-900 rounded-full" />
             <Skeleton className="h-9 w-24 bg-zinc-900 rounded-full" />
             <Skeleton className="h-9 w-24 bg-zinc-900 rounded-full hidden sm:block" />
             <Skeleton className="h-9 w-24 bg-zinc-900 rounded-full hidden sm:block" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col justify-between rounded-2xl bg-zinc-900/20 border border-zinc-800/30 p-5 space-y-4">
               <div className="flex items-start justify-between">
                 <div className="flex items-center gap-3">
                   <Skeleton className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0" />
                   <div className="space-y-2">
                     <Skeleton className="h-4 w-32 bg-zinc-800" />
                     <Skeleton className="h-3 w-20 bg-zinc-800" />
                   </div>
                 </div>
               </div>
               <div><Skeleton className="h-4 w-16 bg-zinc-800 rounded-full" /></div>
               <div className="space-y-3 pt-2 border-t border-zinc-800/30">
                 <Skeleton className="h-3 w-3/4 bg-zinc-800" />
                 <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                 <Skeleton className="h-3 w-2/3 bg-zinc-800" />
               </div>
               <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/30">
                 <Skeleton className="h-4 w-12 bg-zinc-800" />
                 <div className="flex gap-2">
                   <Skeleton className="h-7 w-7 bg-zinc-800 rounded-lg" />
                   <Skeleton className="h-7 w-7 bg-zinc-800 rounded-lg" />
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
