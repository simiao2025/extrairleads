"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <p className="text-sm text-muted-foreground">
        Mostrando{" "}
        <span className="font-medium text-white">
          {startItem}-{endItem}
        </span>{" "}
        de <span className="font-medium text-white">{totalItems}</span> resultados
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="text-zinc-400 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-zinc-500">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => goToPage(page)}
              className={cn(
                "min-w-[32px] cursor-pointer",
                page === currentPage &&
                  "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/25 backdrop-blur-md hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:scale-105 active:scale-95",
              )}
            >
              {page}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="text-zinc-400 hover:text-white disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
