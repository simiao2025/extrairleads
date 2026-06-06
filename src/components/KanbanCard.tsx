"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import LeadDetailsDialog from "./LeadDetailsDialog";

type LeadStatus =
	| "raw"
	| "qualified"
	| "in_queue"
	| "contacted"
	| "interested"
	| "human_intervention"
	| "discarded";

interface Lead {
	id: number;
	name: string;
	phone: string | null;
	website: string | null;
	niche: string | null;
	city: string | null;
	state: string | null;
	aiScore: number | null;
	aiAnalysis: string | null;
	imageUrl: string | null;
	status: LeadStatus | null;
	metadata: unknown;
	createdAt: Date | null;
	updatedAt: Date | null;
}

interface KanbanCardProps {
	lead: Lead;
	isDragOverlay?: boolean;
}

export function KanbanCard({ lead, isDragOverlay = false }: KanbanCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: lead.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	if (isDragOverlay) {
		return (
			<div className="w-full text-left p-4 rounded-2xl bg-[#09090b]/95 backdrop-blur-xl border border-emerald-500/50 shadow-[0_10px_40px_rgba(16,185,129,0.3)] rotate-2 scale-105 transition-all">
				<CardContent lead={lead} />
			</div>
		);
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group relative flex items-start gap-2",
				isDragging && "opacity-30",
			)}
		>
			<button
				{...attributes}
				{...listeners}
				className="mt-1 shrink-0 cursor-grab active:cursor-grabbing rounded p-0.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-400 transition-opacity"
				aria-label="Arrastar lead"
			>
				<GripVertical className="h-4 w-4" />
			</button>

			<div className="flex-1 min-w-0">
				<LeadDetailsDialog lead={lead} />
			</div>
		</div>
	);
}

function CardContent({ lead }: { lead: Lead }) {
	return (
		<div className="relative">
			<div className="flex justify-between items-start relative z-10 gap-3">
				<div className="flex gap-3 flex-1 min-w-0">
					{lead.imageUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={lead.imageUrl}
							alt={lead.name}
							className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
						/>
					) : (
						<div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
							<span className="text-emerald-500 font-bold text-sm">{lead.name.charAt(0)}</span>
						</div>
					)}
					<div className="flex-1 min-w-0 flex flex-col justify-center">
						<p className="font-bold text-sm text-white/90 leading-tight break-words">
							{lead.name}
						</p>
						<p className="text-[11px] text-white/40 mt-0.5 break-words">
							{lead.city ? `${lead.city}, ${lead.state}` : 'Localização desconhecida'}
						</p>
					</div>
				</div>
				{lead.aiScore && (
					<span className="text-[10px] font-black text-emerald-950 bg-gradient-to-br from-emerald-400 to-emerald-500 px-2 py-1 rounded-md shadow-[0_0_15px_rgba(52,211,153,0.3)] shrink-0">
						{lead.aiScore}
					</span>
				)}
			</div>
			
			<div className="mt-4 flex items-end justify-between relative z-10 gap-2">
				<span className="text-[10px] font-medium bg-white/[0.03] border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-white/70 line-clamp-2 leading-tight flex-1">
					{lead.niche || "Sem Nicho"}
				</span>
				{lead.phone && (
					<div className="flex items-center gap-2 shrink-0">
						<div className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
							<MessageSquare className="w-3.5 h-3.5 text-white/40" />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
