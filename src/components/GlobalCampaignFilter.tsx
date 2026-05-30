"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function GlobalCampaignFilter({ campaigns }: { campaigns: any[] }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentCampaignId = searchParams.get("campaignId") || "";

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const val = e.target.value;
			const params = new URLSearchParams(searchParams.toString());
			if (val === "all" || !val) {
				params.delete("campaignId");
			} else {
				params.set("campaignId", val);
			}
			router.push(`?${params.toString()}`);
		},
		[router, searchParams],
	);

	return (
		<div className="flex items-center gap-3">
			<span className="text-sm text-zinc-400 font-medium">Filtrar por:</span>
			<select
				value={currentCampaignId || "all"}
				onChange={handleChange}
				className="h-10 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer backdrop-blur-sm"
			>
				<option value="all">Todas as Campanhas</option>
				{campaigns.map((c) => (
					<option key={c.id} value={c.id.toString()}>
						{c.name}
					</option>
				))}
			</select>
		</div>
	);
}
