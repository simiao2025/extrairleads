import { and, asc, eq } from "drizzle-orm";
import { Layers, MessageSquare, Star, User } from "lucide-react";
import { checkWhatsAppConnectionAction } from "@/actions/whatsapp";
import { AnalyzeButton, FollowUpButton, OutreachButton } from "@/components/ActionButtons";
import { KanbanBoard } from "@/components/KanbanBoard";
import { GlobalCampaignFilter } from "@/components/GlobalCampaignFilter";
import SearchForm from "@/components/SearchForm";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/db";
import { campaigns, leads } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AnalyticsSection } from "./analytics-section";
import { AutoRefresh } from "@/components/AutoRefresh";

const ITEMS_PER_PAGE = 40;

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  accentGlow,
  delay,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  colorClass: string;
  accentGlow: string;
  delay: number;
}) {
  return (
    <div
      className="group relative flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-500 hover:bg-white/[0.05] hover:border-white/[0.12] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hover glow effect */}
      <div
        className={cn(
          "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          accentGlow,
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] group-hover:scale-110 transition-transform duration-300",
          colorClass,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        <p className={cn("font-heading text-3xl font-black tracking-tight mt-0.5", colorClass)}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; period?: string; campaignId?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || String(ITEMS_PER_PAGE), 10)));
  const offset = (page - 1) * limit;
  const campaignId = params.campaignId ? parseInt(params.campaignId, 10) : undefined;

  const conditions = userId ? [eq(leads.userId, userId)] : [];
  if (campaignId) conditions.push(eq(leads.campaignId, campaignId));

  const allLeads = userId
    ? await db.select().from(leads).where(and(...conditions)).orderBy(asc(leads.createdAt))
    : [];

  const userCampaigns = userId
    ? await db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(asc(campaigns.name))
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

  const selectedCampaignObj = campaignId ? userCampaigns.find((c) => c.id === campaignId) : undefined;
  const isAutoOutreach = selectedCampaignObj?.autoOutreach === "true";
  
  const whatsappStatus = await checkWhatsAppConnectionAction();
  const isWhatsappConnected = whatsappStatus.success && !!whatsappStatus.connected;

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 pt-12 relative overflow-hidden">
      <AutoRefresh interval={5000} />
      {/* Background Effect */}
      <div className="fixed inset-0 bg-cyber-grid pointer-events-none z-0" />
      <div className="fixed inset-0 bg-noise pointer-events-none z-0" />

      {/* Atmospheric glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="mx-auto max-w-[1400px] space-y-10 px-4 py-10 md:px-8 relative z-10">
        {/* ── Hero Section ── */}
        <section className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* Robô Humanoide SDR Neural (Decorativo) */}
          <div className="absolute -top-32 -right-10 w-[600px] h-[600px] pointer-events-none hidden lg:block opacity-50 z-0 select-none">
            {/* Máscaras de Gradiente para mesclar com o fundo */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/20 to-background z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent z-10" />
            <img
              src="/robot.png"
              alt="IA SDR"
              className="w-full h-full object-contain filter brightness-[0.7] mix-blend-lighten -scale-x-100"
            />
          </div>

          <div className="relative space-y-5 max-w-2xl z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold tracking-widest text-emerald-400 uppercase backdrop-blur-md">
              <span className="pulse-dot" />
              IA Neural Ativa
            </span>

            <h1 className="font-heading text-5xl font-black leading-[1.08] tracking-tight md:text-6xl text-foreground">
              Extrair, Qualificar &amp;{" "}
              <span className="text-[#25D366]">
                Vender.
              </span>
            </h1>
            
            <GlobalCampaignFilter campaigns={userCampaigns} />

            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              O primeiro motor autônomo de prospecção do Brasil. Localizamos o lead ideal, validamos
              o perfil e iniciamos o engajamento de forma invisível e em milissegundos.
            </p>
          </div>

          <div className="relative flex flex-col sm:flex-row shrink-0 items-stretch sm:items-center gap-3 w-full md:w-auto z-10">
            <AnalyzeButton campaignId={campaignId} rawLeadsCount={leadsByStatus.raw} />
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
        <div className="animate-in fade-in zoom-in-95 duration-1000 delay-200 fill-mode-both rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
          <SearchForm campaigns={userCampaigns} selectedCampaignId={params.campaignId} />
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Leads Totais"
            value={counts.total.toString()}
            icon={Layers}
            colorClass="text-sky-400"
            accentGlow="bg-sky-500/20"
            delay={300}
          />
          <StatCard
            label="Qualificados IA"
            value={counts.qualified.toString()}
            icon={User}
            colorClass="text-emerald-400"
            accentGlow="bg-emerald-500/20"
            delay={400}
          />
          <StatCard
            label="Msgs Enviadas"
            value={counts.contacted.toString()}
            icon={MessageSquare}
            colorClass="text-violet-400"
            accentGlow="bg-violet-500/20"
            delay={500}
          />
          <StatCard
            label="Interessados"
            value={counts.interested.toString()}
            icon={Star}
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
    </main>
  );
}
