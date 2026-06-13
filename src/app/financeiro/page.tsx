"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const kpis = [
  { label: "Receita Bruta", value: 48500, prev: 45000, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Custos Totais", value: 23000, prev: 21000, icon: TrendingDown, color: "text-red-400", bg: "bg-red-400/10" },
  { label: "Lucro Líquido", value: 25500, prev: 24000, icon: DollarSign, color: "text-nexus-400", bg: "bg-nexus-400/10" },
  { label: "Inadimplência", value: 4200, prev: 3800, icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10" },
];

const barData = [
  { mes: "Jan", receita: 32000, custo: 18000, lucro: 14000 },
  { mes: "Fev", receita: 38000, custo: 20000, lucro: 18000 },
  { mes: "Mar", receita: 35000, custo: 19000, lucro: 16000 },
  { mes: "Abr", receita: 42000, custo: 22000, lucro: 20000 },
  { mes: "Mai", receita: 45000, custo: 21000, lucro: 24000 },
  { mes: "Jun", receita: 48500, custo: 23000, lucro: 25500 },
];

const custosPie = [
  { name: "Equipe", value: 14000, color: "#6366f1" },
  { name: "Ferramentas", value: 3500, color: "#7c3aed" },
  { name: "Tráfego pago", value: 2800, color: "#0ea5e9" },
  { name: "Outros", value: 2700, color: "#f59e0b" },
];

const lancamentos = [
  { desc: "Mensalidade - Dr. Mussi", tipo: "receita", valor: 4500, status: "pago", data: "01/06" },
  { desc: "Mensalidade - Clínica Vita", tipo: "receita", valor: 6200, status: "pago", data: "02/06" },
  { desc: "Mensalidade - Instituto Saúde", tipo: "receita", valor: 3800, status: "pendente", data: "05/06" },
  { desc: "Ferramentas (Meta, Adobe, etc)", tipo: "custo", valor: 1200, status: "pago", data: "01/06" },
  { desc: "Salário - Equipe", tipo: "custo", valor: 14000, status: "pago", data: "05/06" },
  { desc: "Mensalidade - Dr. Costa", tipo: "receita", valor: 3500, status: "atrasado", data: "01/06" },
  { desc: "VPS + Infraestrutura", tipo: "custo", valor: 320, status: "pago", data: "01/06" },
];

const statusCor: Record<string, string> = {
  pago: "text-emerald-400 bg-emerald-400/10",
  pendente: "text-orange-400 bg-orange-400/10",
  atrasado: "text-red-400 bg-red-400/10",
};

export default function FinanceiroPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Junho 2026</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const pct = (((kpi.value - kpi.prev) / kpi.prev) * 100).toFixed(1);
          const up = kpi.value >= kpi.prev;
          return (
            <div key={kpi.label} className="glass rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kpi.bg)}>
                  <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(kpi.value)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {up ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                  <span className={cn("text-xs", up ? "text-emerald-400" : "text-red-400")}>
                    {up ? "+" : ""}{pct}% vs mês anterior
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 glass rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Receita · Custo · Lucro</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis dataKey="mes" tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => [formatCurrency(v)]}
              />
              <Bar dataKey="receita" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custo" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-2 glass rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Composição de Custos</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={custosPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {custosPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => [formatCurrency(v)]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lançamentos */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Lançamentos — Junho</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
              Filtrar
            </button>
            <button className="px-3 py-1.5 text-xs text-nexus-300 border border-nexus-500/30 rounded-lg hover:bg-nexus-500/10 transition-colors">
              Exportar
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/20">
              {["Descrição", "Tipo", "Data", "Valor", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lancamentos.map((l, i) => (
              <tr key={i} className="hover:bg-accent/20 transition-colors">
                <td className="px-5 py-3.5 text-sm text-foreground">{l.desc}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {l.tipo === "receita" ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className={cn("text-xs font-medium capitalize", l.tipo === "receita" ? "text-emerald-400" : "text-red-400")}>
                      {l.tipo}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">{l.data}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-foreground">
                  {formatCurrency(l.valor)}
                </td>
                <td className="px-5 py-3.5">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", statusCor[l.status])}>
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
