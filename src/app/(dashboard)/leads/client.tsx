"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lead } from "@/components/KanbanBoard";
import { LeadsTable } from "@/components/LeadsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 20;
const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "raw", label: "Novo" },
  { value: "qualified", label: "Qualificado" },
  { value: "in_queue", label: "Na Fila" },
  { value: "contacted", label: "Contatado" },
  { value: "interested", label: "Interessado" },
  { value: "discarded", label: "Descartado" },
];

interface LeadsClientProps {
  initialSearch: string;
  initialStatus: string;
  filteredLeads: Lead[];
  currentPage: number;
}

export function LeadsClient({
  initialSearch,
  initialStatus,
  filteredLeads,
  currentPage,
}: LeadsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const pagedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    router.push(`/leads?${params.toString()}`);
  }

  function handleClear() {
    setSearch("");
    setStatus("");
    router.push("/leads");
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, telefone, website..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="pl-10 bg-zinc-900 border-zinc-800"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-nowrap">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setStatus(opt.value);
                  const params = new URLSearchParams();
                  if (search) params.set("search", search);
                  if (opt.value) params.set("status", opt.value);
                  router.push(`/leads?${params.toString()}`);
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {(search || status) && (
          <Button variant="ghost" size="icon-sm" onClick={handleClear} className="text-zinc-500">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <LeadsTable key={refreshKey} leads={pagedLeads} onRefresh={handleRefresh} />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeads.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}
    </>
  );
}
