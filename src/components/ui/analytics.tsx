"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#38bdf8", "#34d399", "#a78bfa", "#fb923c", "#f87171"];

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

interface AnalyticsChartProps {
  title: string;
  type: "area" | "bar" | "pie";
  data: ChartData[];
  height?: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-3 shadow-xl">
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold text-white">
          {entry.name}: <span className="text-emerald-400">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AnalyticsChart({ title, type, data, height = 280 }: AnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-zinc-800/50 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-zinc-300">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-zinc-600 text-sm">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800/50 bg-zinc-950/40">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-zinc-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {type === "pie" ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : type === "area" ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                name="Leads"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Quantidade" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>

        {type === "pie" && (
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-zinc-400">
                  {item.name} <span className="font-bold text-white">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  icon?: React.ReactNode;
  color?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = "text-emerald-400",
}: MetricCardProps) {
  return (
    <Card className="border-zinc-800/50 bg-zinc-950/40 hover:border-zinc-700/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{title}</p>
            <p className={`text-3xl font-black font-heading tracking-tight mt-1 ${color}`}>
              {value}
            </p>
            {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
            {trend && (
              <p
                className={`text-xs font-bold mt-1 ${trend.positive ? "text-emerald-400" : "text-red-400"}`}
              >
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
