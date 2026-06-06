"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface DashboardGreetingProps {
	name: string;
	leadsToContact: number;
	leadsToFollowUp: number;
}

export function DashboardGreeting({ name, leadsToContact, leadsToFollowUp }: DashboardGreetingProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) return <div className="h-28 animate-pulse bg-zinc-900/50 rounded-2xl mb-8" />;

	const now = new Date();
	const hour = now.getHours();
	const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";
	
	const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: 'long' }).format(now).toUpperCase();
	const day = now.getDate().toString().padStart(2, "0");
	const month = new Intl.DateTimeFormat("pt-BR", { month: 'short' }).format(now).toUpperCase().replace(".", "");

	const firstName = name.split(" ")[0].toUpperCase();

	return (
		<div className="flex flex-col mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
			<div className="flex flex-col gap-1 mb-6">
				<p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
					{greeting}, {firstName} <span className="text-zinc-700">•</span> {weekday}, {day} DE {month}.
				</p>
				<h2 className="text-2xl md:text-3xl font-black text-white tracking-tight whitespace-nowrap">
					Aqui está o que fazer hoje
				</h2>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Card de Tarefa 1 */}
				<Link href="/leads?status=qualified" className="group flex items-center gap-4 p-4 rounded-xl border border-emerald-500/20 bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors relative overflow-hidden">
					<div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
					
					<div className="flex-1 min-w-0 z-10">
						<h3 className="text-sm font-bold text-zinc-200">
							{leadsToContact > 0 ? `${leadsToContact} leads qualificados para abordar` : "Nenhum lead novo para abordar"}
						</h3>
						<p className="text-xs text-zinc-500 leading-relaxed mt-1">
							O Scout preparou sugestões de mensagens de abertura baseadas no nicho e região de cada lead.
						</p>
					</div>
					
					<div className="shrink-0 text-zinc-600 group-hover:text-emerald-500 transition-colors z-10">
						<ChevronRight className="w-5 h-5" />
					</div>
				</Link>

				{/* Card de Tarefa 2 */}
				{leadsToFollowUp > 0 && (
					<Link href="/leads?status=contacted" className="group flex items-center gap-4 p-4 rounded-xl border border-orange-500/20 bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors relative overflow-hidden">
						<div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
						
						<div className="flex-1 min-w-0 z-10">
							<h3 className="text-sm font-bold text-zinc-200">
								{leadsToFollowUp} leads aguardando Follow-up
							</h3>
							<p className="text-xs text-zinc-500 leading-relaxed mt-1">
								Lembre-se de retornar o contato para manter os leads aquecidos. O Scout sugere reabordagens curtas.
							</p>
						</div>
						
						<div className="shrink-0 text-zinc-600 group-hover:text-orange-500 transition-colors z-10">
							<ChevronRight className="w-5 h-5" />
						</div>
					</Link>
				)}
			</div>
		</div>
	);
}
