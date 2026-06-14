"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, DollarSign, Image } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function DadosPage() {
  const [data, setData] = useState({
    active_clients: 0, total_clients: 0, mrr: 0,
    pending_midias: 0, paid_revenue: 0, overdue_invoices: 0,
    total_expenses: 0, profit: 0,
  });
  const [clientesMrr, setClientesMrr] = useState<{ name: string; fee: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r => r.json()),
      supabase.from("clients").select("name, monthly_fee, status").eq("status", "active").order("monthly_fee", { ascending: false }),
    ]).then(([dash, cli]) => {
      setData(dash);
      setClientesMrr(((cli.data as any) || []).map(c => ({ name: c.name, fee: Number(c.monthly_fee) })));
      setLoading(false);
    });
  }, []);

  const COLORS = ["#6366f1", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#f87171"];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance Geral</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada de todos os dados da agência</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Clientes Ativos", value: data.active_clients.toString(), sub: `de ${data.total_clients} total`, icon: Users, color: "text-sky-400", bg: "bg-sky-400/10" },
          { label: "MRR", value: formatCurrency(data.mrr), sub: "Receita recorrente mensal", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Mídias Pendentes", value: data.pending_midias.toString(), sub: "Aguardando aprovação", icon: Image, color: "text-orange-400", bg: "bg-orange-400/10" },
          { label: "Lucro Líquido", value: formatCurrency(data.profit), sub: "Receita − despesas", icon: TrendingUp, color: "text-nexus-400", bg: "bg-nexus-400/10" },
        ].map(k => (
          <div key={k.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.bg}`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">MRR por cliente</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={clientesMrr.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [formatCurrency(v), "Mensalidade"]} />
              <Bar dataKey="fee" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Distribuição de MRR</h2>
          <div className="flex items-center justify-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={clientesMrr.slice(0, 6)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="fee">
                  {clientesMrr.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [formatCurrency(v)]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {clientesMrr.slice(0, 6).map((c, i) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground truncate max-w-[100px]">{c.name}</span>
                  <span className="text-foreground font-medium ml-auto">{formatCurrency(c.fee)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
