"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Target, AlertCircle, DollarSign } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";

export default function ProjecoesPage() {
  const [mrr, setMrr] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [meta, setMeta] = useState(60000);
  const [churnRate, setChurnRate] = useState(3);
  const [growthRate, setGrowthRate] = useState(8);

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("monthly_fee, status"),
      supabase.from("expenses").select("amount"),
    ]).then(([cli, exp]) => {
      const activeFee = (cli.data || []).filter(c => c.status === "active").reduce((a, c) => a + Number(c.monthly_fee), 0);
      const totalExp = (exp.data || []).reduce((a, e) => a + Number(e.amount), 0);
      setMrr(activeFee);
      setExpenses(totalExp);
    });
  }, []);

  const projecao = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const receitaProjetada = mrr * Math.pow(1 + growthRate / 100 - churnRate / 100, mes);
    const custoProjetado = expenses * (1 + 0.03 * mes);
    return {
      mes: `M+${mes}`,
      receita: Math.round(receitaProjetada),
      custo: Math.round(custoProjetado),
      lucro: Math.round(receitaProjetada - custoProjetado),
    };
  });

  const mesesParaMeta = projecao.findIndex(p => p.receita >= meta);
  const lucroProjetado12m = projecao[11]?.lucro || 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Projeções Financeiras</h1>
        <p className="text-sm text-muted-foreground">Simulação baseada nos dados atuais</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">MRR Atual</p>
          <p className="text-xl font-bold text-nexus-400">{formatCurrency(mrr)}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Custos/mês</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(expenses)}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">MRR em 12m</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(projecao[11]?.receita || 0)}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Lucro em 12m</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(lucroProjetado12m)}</p>
        </div>
      </div>

      {/* Controles */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Parâmetros da simulação</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-muted-foreground">Crescimento mensal</label>
              <span className="text-xs font-medium text-emerald-400">{growthRate}%</span>
            </div>
            <input type="range" min={0} max={30} value={growthRate} onChange={e => setGrowthRate(Number(e.target.value))} className="w-full accent-nexus-500" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-muted-foreground">Churn mensal</label>
              <span className="text-xs font-medium text-red-400">{churnRate}%</span>
            </div>
            <input type="range" min={0} max={20} value={churnRate} onChange={e => setChurnRate(Number(e.target.value))} className="w-full accent-red-500" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-muted-foreground">Meta de MRR</label>
              <span className="text-xs font-medium text-nexus-400">{formatCurrency(meta)}</span>
            </div>
            <input type="range" min={20000} max={200000} step={5000} value={meta} onChange={e => setMeta(Number(e.target.value))} className="w-full accent-nexus-500" />
          </div>
        </div>
        {mesesParaMeta >= 0 && mesesParaMeta < 12 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
            <Target className="w-4 h-4 text-emerald-400" />
            <p className="text-sm text-emerald-400">Meta de {formatCurrency(meta)} atingida em <strong>M+{mesesParaMeta + 1}</strong> com esse crescimento</p>
          </div>
        )}
        {mesesParaMeta === -1 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-400/5 border border-orange-400/20">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <p className="text-sm text-orange-400">A meta de {formatCurrency(meta)} não é atingida em 12 meses com esse crescimento</p>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-6">Projeção 12 meses</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={projecao}>
            <defs>
              <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gLuc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
            <XAxis dataKey="mes" tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [formatCurrency(v)]} />
            <ReferenceLine y={meta} stroke="#f59e0b" strokeDasharray="6 3" label={{ value: "Meta", fill: "#f59e0b", fontSize: 11, position: "insideTopRight" }} />
            <Area type="monotone" dataKey="receita" stroke="#6366f1" strokeWidth={2} fill="url(#gRec)" name="Receita" />
            <Area type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} fill="url(#gLuc)" name="Lucro" />
            <Line type="monotone" dataKey="custo" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Custo" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
