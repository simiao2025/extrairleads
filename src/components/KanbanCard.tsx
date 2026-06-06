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
		<div className="relative flex flex-col items-center">
			{lead.aiScore && (
				<div className="absolute -top-1 -right-1 z-20">
					<span className="text-[10px] font-black text-emerald-950 bg-gradient-to-br from-emerald-400 to-emerald-500 px-2 py-1 rounded-md shadow-[0_0_15px_rgba(52,211,153,0.3)]">
						{lead.aiScore}
					</span>
				</div>
			)}

			<div className="relative z-10 flex flex-col items-center w-full">
				{lead.imageUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={lead.imageUrl}
						alt={lead.name}
						className="w-14 h-14 rounded-full object-cover border-2 border-white/10 shadow-lg mb-3"
					/>
				) : (
					<div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center shadow-lg mb-3">
						<span className="text-emerald-500 font-bold text-lg">{lead.name.charAt(0)}</span>
					</div>
				)}
				
				<div className="w-full text-center px-1">
					<p className="font-bold text-xs text-white/90 leading-snug line-clamp-2 mb-1">
						{lead.name}
					</p>
					<p className="text-[10px] text-white/40 line-clamp-1">
						{lead.city ? `${lead.city}, ${lead.state}` : 'Localização desconhecida'}
					</p>
				</div>
			</div>
			
			<div className="mt-5 w-full flex items-center justify-between relative z-10 border-t border-white/[0.05] pt-3">
				<span className="text-[9px] font-medium bg-white/[0.03] border border-white/[0.08] px-2 py-1 rounded-md text-white/70 line-clamp-1 truncate max-w-[70%] text-center">
					{lead.niche || "Sem Nicho"}
				</span>
				{lead.phone && (
					<div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.02] border border-white/[0.05]">
						<MessageSquare className="w-3.5 h-3.5 text-white/40" />
					</div>
				)}
			</div>
		</div>
	);
}
