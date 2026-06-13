"use client";

import { cn, formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  DollarSign,
  Image,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const kpis = [
  {
    label: "Receita do Mês",
    value: formatCurrency(48500),
    change: "+12%",
    up: true,
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    label: "Mídias Pendentes",
    value: "14",
    change: "3 urgentes",
    up: false,
    icon: Image,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    label: "Clientes Ativos",
    value: "23",
    change: "+2 este mês",
    up: true,
    icon: Users,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  {
    label: "Tarefas Atrasadas",
    value: "5",
    change: "Requer atenção",
    up: false,
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
];

const revenueData = [
  { mes: "Jan", receita: 32000, custo: 18000 },
  { mes: "Fev", receita: 38000, custo: 20000 },
  { mes: "Mar", receita: 35000, custo: 19000 },
  { mes: "Abr", receita: 42000, custo: 22000 },
  { mes: "Mai", receita: 45000, custo: 21000 },
  { mes: "Jun", receita: 48500, custo: 23000 },
];

const recentActivity = [
  { user: "Guto", action: "enviou 3 reels para aprovação", time: "5min", status: "pendente" },
  { user: "Augusto", action: "finalizou stories do Dr. Mussi", time: "22min", status: "concluido" },
  { user: "Fernando", action: "atualizou narrativa da Clínica Vita", time: "1h", status: "concluido" },
  { user: "Gerval", action: "gerou roteiro para campanha junho", time: "2h", status: "revisao" },
  { user: "Petterson", action: "agendou 12 posts para semana", time: "3h", status: "concluido" },
];

const statusColors: Record<string, string> = {
  pendente: "text-orange-400 bg-orange-400/10",
  concluido: "text-emerald-400 bg-emerald-400/10",
  revisao: "text-violet-400 bg-violet-400/10",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  concluido: "Concluído",
  revisao: "Em revisão",
};

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão geral da Impulse Media — Junho 2026
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {kpi.label}
              </p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kpi.bg)}>
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {kpi.up ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span className={cn("text-xs", kpi.up ? "text-emerald-400" : "text-red-400")}>
                  {kpi.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <div className="col-span-3 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Receita vs Custos</h2>
              <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-nexus-400" />
                <span className="text-muted-foreground">Receita</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-muted-foreground">Custos</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis
                dataKey="mes"
                tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(224 71% 6%)",
                  border: "1px solid hsl(216 34% 17%)",
                  borderRadius: "8px",
                  color: "hsl(213 31% 91%)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [formatCurrency(value)]}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorReceita)"
              />
              <Area
                type="monotone"
                dataKey="custo"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#colorCusto)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Feed */}
        <div className="col-span-2 glass rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {item.user[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">
                    <span className="font-medium">{item.user}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {item.time}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        statusColors[item.status]
                      )}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Production Status */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5">Status de Produção — Equipe</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { name: "Guto", role: "Videomaker", done: 8, total: 12, color: "bg-nexus-500" },
            { name: "Augusto", role: "Stories", done: 15, total: 20, color: "bg-violet-500" },
            { name: "Fernando", role: "Branding", done: 3, total: 5, color: "bg-sky-500" },
            { name: "Gerval", role: "Copywriter", done: 10, total: 14, color: "bg-emerald-500" },
            { name: "Petterson", role: "Social Media", done: 22, total: 24, color: "bg-orange-500" },
          ].map((member) => (
            <div key={member.name} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold">
                  {member.name[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <div className="w-full bg-accent rounded-full h-1.5">
                <div
                  className={cn("h-1.5 rounded-full transition-all", member.color)}
                  style={{ width: `${(member.done / member.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {member.done}/{member.total} entregas
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
