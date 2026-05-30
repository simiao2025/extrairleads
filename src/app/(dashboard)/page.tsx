import { and, asc, eq } from "drizzle-orm";
import { Layers, MessageSquare, Star, User } from "lucide-react";
import { checkWhatsAppConnectionAction } from "@/actions/whatsapp";
import {
	AnalyzeButton,
	FollowUpButton,
	OutreachButton,
} from "@/components/ActionButtons";
import { GlobalCampaignFilter } from "@/components/GlobalCampaignFilter";
import { KanbanBoard } from "@/components/KanbanBoard";
import { MatrixRain } from "@/components/MatrixRain";
import SearchForm from "@/components/SearchForm";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/db";
import { campaigns, leads } from "@/db/schema";
import { auth } from "@/lib/auth";
import { AnalyticsSection } from "./analytics-section";

const ITEMS_PER_PAGE = 40;

import { StatCard } from "@/components/StatCard";

interface PageProps {
	searchParams: Promise<{
		page?: string;
		limit?: string;
		period?: string;
		campaignId?: string;
	}>;
}

export default async function Home({ searchParams }: PageProps) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

	const params = await searchParams;
	const page = Math.max(1, parseInt(params.page || "1", 10));
	const limit = Math.min(
		100,
		Math.max(1, parseInt(params.limit || String(ITEMS_PER_PAGE), 10)),
	);
	const offset = (page - 1) * limit;
	const campaignId = params.campaignId
		? parseInt(params.campaignId, 10)
		: undefined;

	const conditions = userId ? [eq(leads.userId, userId)] : [];
	if (campaignId) conditions.push(eq(leads.campaignId, campaignId));

	const allLeads = userId
		? await db
				.select()
				.from(leads)
				.where(and(...conditions))
				.orderBy(asc(leads.createdAt))
		: [];

	const userCampaigns = userId
		? await db
				.select()
				.from(campaigns)
				.where(eq(campaigns.userId, userId))
				.orderBy(asc(campaigns.name))
		: [];

	const totalItems = allLeads.length;
	const totalPages = Math.ceil(totalItems / limit);

	const pagedLeads = allLeads.slice(offset, offset + limit);

	const counts = {
		total: allLeads.length,
		qualified: allLeads.filter((l) => l.status === "qualified").length,
		contacted: allLeads.filter((l) => l.status === "contacted").length,
		interested: allLeads.filter((l) => l.status === "interested").length,
	};

	const leadsByStatus = {
		raw: allLeads.filter((l) => l.status === "raw").length,
		qualified: allLeads.filter((l) => l.status === "qualified").length,
		contacted: allLeads.filter((l) => l.status === "contacted").length,
		interested: allLeads.filter((l) => l.status === "interested").length,
		discarded: allLeads.filter((l) => l.status === "discarded").length,
	};

	const conversionRate =
		counts.total > 0 ? Math.round((counts.interested / counts.total) * 100) : 0;

	const selectedCampaignObj = campaignId
		? userCampaigns.find((c) => c.id === campaignId)
		: undefined;
	const isAutoOutreach = selectedCampaignObj?.autoOutreach === "true";

	const whatsappStatus = await checkWhatsAppConnectionAction();
	const isWhatsappConnected =
		whatsappStatus.success && !!whatsappStatus.connected;

	return (
		<div className="relative min-h-screen bg-background text-foreground p-4 md:p-8 overflow-hidden">
			{/* Background Effect */}
			<div className="fixed inset-0 bg-cyber-grid pointer-events-none z-0" />
			<div className="fixed inset-0 bg-noise pointer-events-none z-0" />

			{/* Atmospheric glows */}
			<div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[150px] pointer-events-none z-0" />
			<div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none z-0" />

			<div className="mx-auto max-w-[1400px] space-y-10 px-4 py-10 md:px-8 relative z-10">
				{/* ── Hero Section ── */}
				<section className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between animate-in fade-in slide-in-from-bottom-8 duration-1000">
					{/* Efeito Matrix Background Full Width */}
					<div className="absolute -inset-y-20 -inset-x-4 md:-inset-x-20 -z-10 overflow-hidden opacity-40 pointer-events-none">
						{/* Gradientes para suavizar as bordas da Matrix */}
						<div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10" />
						<div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background z-10" />
						<div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />
						<MatrixRain />
					</div>

					{/* Robô Humanoide SDR Neural (Decorativo) */}
					<div className="absolute -top-32 -right-10 w-[600px] h-[600px] pointer-events-none hidden lg:block opacity-[0.85] z-0 select-none">
						{/* Máscaras de Gradiente para mesclar com o fundo */}
						<div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
						<div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/10 to-background z-10" />
						<div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent z-10" />
						<img
							src="/robot.png"
							alt="IA SDR"
							className="w-full h-full object-contain filter brightness-[0.7] mix-blend-lighten -scale-x-100 relative z-0"
						/>
					</div>

					<div className="relative space-y-5 max-w-2xl z-10">
						<span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold tracking-widest text-emerald-400 uppercase backdrop-blur-md">
							<span className="pulse-dot" />
							IA Neural Ativa
						</span>

						<h1 className="font-heading text-5xl font-black leading-[1.08] tracking-tight md:text-6xl text-foreground">
							Extrair, Qualificar &amp;{" "}
							<span className="text-[#25D366]">Vender.</span>
						</h1>

						<GlobalCampaignFilter campaigns={userCampaigns} />

						<p className="text-base text-muted-foreground leading-relaxed max-w-xl">
							O primeiro motor autônomo de prospecção do Brasil. Localizamos o
							lead ideal, validamos o perfil e iniciamos o engajamento de forma
							invisível e em milissegundos.
						</p>
					</div>

					<div className="relative flex flex-col sm:flex-row shrink-0 items-stretch sm:items-center gap-3 w-full md:w-auto z-10">
						<AnalyzeButton
							campaignId={campaignId}
							rawLeadsCount={leadsByStatus.raw}
						/>
						<FollowUpButton
							campaignId={campaignId}
							hasContactedLeads={leadsByStatus.contacted > 0}
							isWhatsappConnected={isWhatsappConnected}
						/>
						<OutreachButton
							campaignId={campaignId}
							isAutoOutreach={isAutoOutreach}
							isWhatsappConnected={isWhatsappConnected}
						/>
					</div>
				</section>

				{/* ── Search Form ── */}
				<div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-200 fill-mode-both rounded-2xl p-[1px] overflow-hidden group">
					{/* Fio luminoso (Border Beam) animado */}
					<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
						<div
							className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square bg-[conic-gradient(from_0deg,transparent_0_340deg,#10b981_360deg)] animate-spin"
							style={{ animationDuration: "4s", animationDirection: "reverse" }}
						/>
					</div>

					{/* Fundo escuro interno para mascarar o gradiente, deixando só a borda viva */}
					<div className="relative z-10 w-full h-full bg-[#050505] rounded-2xl border border-white/[0.04]">
						<SearchForm
							campaigns={userCampaigns}
							selectedCampaignId={params.campaignId}
						/>
					</div>
				</div>

				{/* ── Stats ── */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						label="Leads Totais"
						value={counts.total.toString()}
						icon={<Layers className="h-5 w-5" />}
						colorClass="text-sky-400"
						accentGlow="bg-sky-500/20"
						delay={300}
					/>
					<StatCard
						label="Qualificados IA"
						value={counts.qualified.toString()}
						icon={<User className="h-5 w-5" />}
						colorClass="text-emerald-400"
						accentGlow="bg-emerald-500/20"
						delay={400}
					/>
					<StatCard
						label="Msgs Enviadas"
						value={counts.contacted.toString()}
						icon={<MessageSquare className="h-5 w-5" />}
						colorClass="text-violet-400"
						accentGlow="bg-violet-500/20"
						delay={500}
					/>
					<StatCard
						label="Interessados"
						value={counts.interested.toString()}
						icon={<Star className="h-5 w-5" />}
						colorClass="text-amber-400"
						accentGlow="bg-amber-500/20"
						delay={600}
					/>
				</div>

				{/* ── Analytics Section ── */}
				<AnalyticsSection
					leadsByStatus={leadsByStatus}
					conversionRate={conversionRate}
					totalLeads={counts.total}
					qualifiedLeads={counts.qualified}
				/>

				{/* ── Kanban ── */}
				<section className="space-y-5">
					<div className="flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
							<Layers className="h-4 w-4 text-emerald-400" />
						</div>
						<h2 className="font-heading text-lg font-bold tracking-tight text-white">
							Pipeline Inteligente
						</h2>
					</div>

					<KanbanBoard initialLeads={pagedLeads} />
					<Pagination
						currentPage={page}
						totalPages={totalPages}
						totalItems={totalItems}
						itemsPerPage={limit}
					/>
				</section>
			</div>
		</div>
	);
}
