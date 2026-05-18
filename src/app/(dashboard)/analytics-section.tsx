import { AnalyticsChart, MetricCard } from "@/components/ui/analytics";
import { TrendingUp, Target, Zap, Percent } from "lucide-react";

interface AnalyticsSectionProps {
  leadsByStatus: Record<string, number>;
  conversionRate: number;
  totalLeads: number;
  qualifiedLeads: number;
}

const STATUS_COLORS: Record<string, string> = {
  raw: "#38bdf8",
  qualified: "#34d399",
  contacted: "#a78bfa",
  interested: "#fb923c",
  discarded: "#71717a",
};

const STATUS_LABELS: Record<string, string> = {
  raw: "Novos",
  qualified: "Qualificados",
  contacted: "Contatados",
  interested: "Interessados",
  discarded: "Descartados",
};

export function AnalyticsSection({ leadsByStatus, conversionRate, totalLeads, qualifiedLeads }: AnalyticsSectionProps) {
  const pieData = Object.entries(leadsByStatus)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: STATUS_LABELS[name] || name,
      value,
      fill: STATUS_COLORS[name] || "#71717a",
    }));

  const avgScore = totalLeads > 0
    ? Math.round((leadsByStatus.qualified / totalLeads) * 100)
    : 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="font-heading text-lg font-semibold tracking-tight text-white">
          Métricas & Analytics
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Taxa de Qualificação"
          value={`${avgScore}%`}
          subtitle="Leads qualificados / total"
          icon={<Target className="h-5 w-5 text-emerald-400" />}
          color="text-emerald-400"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          subtitle="Interessados / Total"
          icon={<TrendingUp className="h-5 w-5 text-orange-400" />}
          color="text-orange-400"
        />
        <MetricCard
          title="Total Extraídos"
          value={totalLeads}
          subtitle="Leads no banco de dados"
          icon={<Zap className="h-5 w-5 text-sky-400" />}
          color="text-sky-400"
        />
        <MetricCard
          title="Leads Qualificados"
          value={qualifiedLeads}
          subtitle="Prontos para abordagem"
          icon={<Percent className="h-5 w-5 text-purple-400" />}
          color="text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AnalyticsChart
          title="Distribuição por Status"
          type="pie"
          data={pieData}
        />
        <div className="lg:col-span-2">
          <AnalyticsChart
            title="Visão Geral do Pipeline"
            type="bar"
            data={[
              { name: "Novos", value: leadsByStatus.raw || 0 },
              { name: "Qualificados", value: leadsByStatus.qualified || 0 },
              { name: "Contatados", value: leadsByStatus.contacted || 0 },
              { name: "Interessados", value: leadsByStatus.interested || 0 },
              { name: "Descartados", value: leadsByStatus.discarded || 0 },
            ]}
            height={260}
          />
        </div>
      </div>
    </section>
  );
}