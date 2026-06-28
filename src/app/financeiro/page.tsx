"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, Plus,
  ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

type Invoice = { id: string; amount: number; status: string; due_date: string | null; paid_at: string | null; created_at: string; description: string | null; clients?: { name: string } };
type Expense = { id: string; description: string; amount: number; category: string; date: string };

const PIE_COLORS = ["#6366f1", "#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#f87171"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const statusCor: Record<string, string> = {
  pago: "text-emerald-400 bg-emerald-400/10",
  pendente: "text-orange-400 bg-orange-400/10",
  atrasado: "text-red-400 bg-red-400/10",
};
const statusMap: Record<string, string> = { paid: "pago", pending: "pendente", sent: "pendente", overdue: "atrasado" };

export default function FinanceiroPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("invoices").select("*, clients(name)").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
    ]).then(([inv, exp]) => {
      setInvoices((inv.data as any) || []);
      setExpenses((exp.data as any) || []);
      setLoading(false);
    });
  }, []);

  const invDate = (i: Invoice) => (i.paid_at || i.due_date || i.created_at).slice(0, 7); // YYYY-MM
  const now = new Date();
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const sumInv = (key: string) => invoices.filter(i => invDate(i) === key).reduce((a, i) => a + Number(i.amount), 0);
  const sumExp = (key: string) => expenses.filter(e => e.date.slice(0, 7) === key).reduce((a, e) => a + Number(e.amount), 0);

  const receita = sumInv(curKey);
  const custos = sumExp(curKey);
  const lucro = receita - custos;
  const inadimplencia = invoices.filter(i => invDate(i) === curKey && (i.status === "pending" || i.status === "overdue" || i.status === "sent")).reduce((a, i) => a + Number(i.amount), 0);

  const receitaPrev = sumInv(prevKey), custosPrev = sumExp(prevKey);
  const kpis = [
    { label: "Receita Bruta", value: receita, prev: receitaPrev, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Custos Totais", value: custos, prev: custosPrev, icon: TrendingDown, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "Lucro Líquido", value: lucro, prev: receitaPrev - custosPrev, icon: DollarSign, color: "text-nexus-400", bg: "bg-nexus-400/10" },
    { label: "Inadimplência", value: inadimplencia, prev: 0, icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10" },
  ];

  // Últimos 6 meses
  const barData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const r = sumInv(key), c = sumExp(key);
    return { mes: MESES[d.getMonth()], receita: r, custo: c, lucro: r - c };
  });

  // Pie de custos por categoria (mês atual)
  const catMap: Record<string, number> = {};
  expenses.filter(e => e.date.slice(0, 7) === curKey).forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
  });
  const custosPie = Object.entries(catMap).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));

  // Lançamentos do mês (receitas + custos)
  const lancamentos = [
    ...invoices.filter(i => invDate(i) === curKey).map(i => ({
      desc: i.description || `Receita - ${i.clients?.name || "—"}`, tipo: "receita" as const,
      valor: Number(i.amount), status: statusMap[i.status] || "pendente",
      data: (i.paid_at || i.due_date || i.created_at).slice(0, 10),
    })),
    ...expenses.filter(e => e.date.slice(0, 7) === curKey).map(e => ({
      desc: e.description, tipo: "custo" as const, valor: Number(e.amount), status: "pago", data: e.date,
    })),
  ].sort((a, b) => b.data.localeCompare(a.data));

  const fmtData = (d: string) => { const [y, m, dd] = d.split("-"); return `${dd}/${m}`; };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{MESES[now.getMonth()]} {now.getFullYear()}</p>
        </div>
        <a href="/financeiro/receitas" className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </a>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const pct = kpi.prev > 0 ? (((kpi.value - kpi.prev) / kpi.prev) * 100).toFixed(1) : null;
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
                    {pct !== null ? (
                      <div className="flex items-center gap-1 mt-1">
                        {up ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                        <span className={cn("text-xs", up ? "text-emerald-400" : "text-red-400")}>{up ? "+" : ""}{pct}% vs mês anterior</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground mt-1 block">sem base anterior</span>
                    )}
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
                  <YAxis tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [formatCurrency(v)]} />
                  <Bar dataKey="receita" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custo" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-2 glass rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Composição de Custos</h2>
              {custosPie.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Sem custos no mês</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={custosPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {custosPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [formatCurrency(v)]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Lançamentos */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Lançamentos — {MESES[now.getMonth()]}</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {["Descrição", "Tipo", "Data", "Valor", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lancamentos.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum lançamento no mês</td></tr>
                ) : lancamentos.map((l, i) => (
                  <tr key={i} className="hover:bg-accent/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-foreground">{l.desc}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {l.tipo === "receita" ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                        <span className={cn("text-xs font-medium capitalize", l.tipo === "receita" ? "text-emerald-400" : "text-red-400")}>{l.tipo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{fmtData(l.data)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{formatCurrency(l.valor)}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", statusCor[l.status])}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
