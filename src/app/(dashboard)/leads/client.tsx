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
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (e.target.value) params.set("status", e.target.value);
            router.push(`/leads?${params.toString()}`);
          }}
          className="h-10 rounded-xl border border-white/[0.08] bg-black/40 px-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-950 text-zinc-300">
              {opt.label}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          onClick={applyFilters}
          className="bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/25 backdrop-blur-md hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 cursor-pointer h-10 px-5 rounded-xl"
        >
          Filtrar
        </Button>
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
