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
	initialCampaignId?: string;
	initialNiche?: string;
	filteredLeads: Lead[];
	campaigns: { id: number; name: string }[];
	niches: string[];
	currentPage: number;
}

export function LeadsClient({
	initialSearch,
	initialStatus,
	initialCampaignId = "",
	initialNiche = "",
	filteredLeads,
	campaigns,
	niches,
	currentPage,
}: LeadsClientProps) {
	const router = useRouter();
	const [search, setSearch] = useState(initialSearch);
	const [status, setStatus] = useState(initialStatus);
	const [campaignId, setCampaignId] = useState(initialCampaignId);
	const [niche, setNiche] = useState(initialNiche);
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
		if (campaignId && campaignId !== "all") params.set("campaignId", campaignId);
		if (niche && niche !== "all") params.set("niche", niche);
		router.push(`/leads?${params.toString()}`);
	}

	const handleStatusChange = (newStatus: string) => {
		setStatus(newStatus);
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (newStatus) params.set("status", newStatus);
		if (campaignId && campaignId !== "all") params.set("campaignId", campaignId);
		if (niche && niche !== "all") params.set("niche", niche);
		router.push(`/leads?${params.toString()}`);
	};

	const handleCampaignChange = (newCampaignId: string) => {
		setCampaignId(newCampaignId);
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (status) params.set("status", status);
		if (newCampaignId && newCampaignId !== "all") params.set("campaignId", newCampaignId);
		if (niche && niche !== "all") params.set("niche", niche);
		router.push(`/leads?${params.toString()}`);
	};

	const handleNicheChange = (newNiche: string) => {
		setNiche(newNiche);
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (status) params.set("status", status);
		if (campaignId && campaignId !== "all") params.set("campaignId", campaignId);
		if (newNiche && newNiche !== "all") params.set("niche", newNiche);
		router.push(`/leads?${params.toString()}`);
	};

	function handleClear() {
		setSearch("");
		setStatus("");
		setCampaignId("");
		setNiche("");
		router.push("/leads");
	}

	function handleRefresh() {
		setRefreshKey((k) => k + 1);
		router.refresh();
	}

	const hasActiveFilters =
		search ||
		status ||
		(campaignId && campaignId !== "all") ||
		(niche && niche !== "all");

	return (
		<>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col lg:flex-row gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
						<Input
							placeholder="Buscar por nome, telefone, website..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && applyFilters()}
							className="pl-10 bg-zinc-900 border-zinc-800 h-10 rounded-xl"
						/>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<select
							value={campaignId || "all"}
							onChange={(e) => handleCampaignChange(e.target.value)}
							className="h-10 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer backdrop-blur-sm sm:w-56"
						>
							<option value="all">Todas as Campanhas</option>
							{campaigns.map((c) => (
								<option key={c.id} value={c.id.toString()}>
									{c.name}
								</option>
							))}
						</select>

						<select
							value={niche || "all"}
							onChange={(e) => handleNicheChange(e.target.value)}
							className="h-10 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer backdrop-blur-sm sm:w-48"
						>
							<option value="all">Todos os Nichos</option>
							{niches.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/10 border border-zinc-800/30 p-3 rounded-xl">
					<div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-nowrap">
						{STATUS_OPTIONS.map((opt) => {
							const isActive = status === opt.value;
							return (
								<button
									key={opt.value}
									onClick={() => handleStatusChange(opt.value)}
									className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
										isActive
											? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
											: "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
									}`}
								>
									{opt.label}
								</button>
							);
						})}
					</div>

					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClear}
							className="text-zinc-400 hover:text-white flex items-center gap-1.5 self-end sm:self-auto"
						>
							<X className="h-4 w-4" /> Limpar Filtros
						</Button>
					)}
				</div>
			</div>

			<LeadsTable
				key={refreshKey}
				leads={pagedLeads}
				onRefresh={handleRefresh}
			/>

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
