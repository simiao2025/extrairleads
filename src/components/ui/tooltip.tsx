import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  className,
}: {
  content: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group relative inline-flex items-center", className)}>
      {children || <Info className="w-4 h-4 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-100 opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
        {content}
        {/* Seta do tooltip */}
        <div className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
      </div>
    </div>
  );
}
