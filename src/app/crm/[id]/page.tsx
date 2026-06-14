"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Client, Invoice, InstagramMetric } from "@/lib/supabase";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft, Instagram, DollarSign, BarChart3, Edit3,
  Save, Loader2, CheckCircle2, PauseCircle, XCircle,
  TrendingUp, Users, Heart,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statusMap = {
  active: { label: "Ativo", icon: CheckCircle2, color: "text-emerald-400" },
  paused: { label: "Pausado", icon: PauseCircle, color: "text-orange-400" },
  churned: { label: "Encerrado", icon: XCircle, color: "text-red-400" },
};

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<InstagramMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [tab, setTab] = useState<"overview" | "financeiro" | "instagram">("overview");

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("invoices").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("instagram_metrics").select("*").eq("client_id", id).order("week_start"),
    ]).then(([c, inv, met]) => {
      if (c.data) { setClient(c.data); setForm(c.data); }
      setInvoices((inv.data as any) || []);
      setMetrics((met.data as any) || []);
      setLoading(false);
    });
  }, [id]);

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.from("clients").update({ ...form, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    setClient(data);
    setEditing(false);
    toast.success("Cliente atualizado");
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!client) return <div className="p-8 text-muted-foreground">Cliente não encontrado</div>;

  const status = statusMap[client.status as keyof typeof statusMap] || statusMap.active;
  const totalPago = invoices.filter(i => i.status === "paid").reduce((a, i) => a + Number(i.amount), 0);
  const latestMetric = metrics[metrics.length - 1];

  const statusCor: Record<string, string> = {
    pending: "text-orange-400 bg-orange-400/10",
    paid: "text-emerald-400 bg-emerald-400/10",
    overdue: "text-red-400 bg-red-400/10",
    sent: "text-sky-400 bg-sky-400/10",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm" className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
          {client.name[0]}
        </div>
        <div className="flex-1">
          {editing ? (
            <input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} className="text-2xl font-bold bg-transparent border-b border-nexus-500 text-foreground focus:outline-none" />
          ) : (
            <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <status.icon className={cn("w-3.5 h-3.5", status.color)} />
            <span className={cn("text-sm", status.color)}>{status.label}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{client.specialty || client.type}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-3 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">
              <Edit3 className="w-4 h-4" /> Editar
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">Mensalidade</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(client.monthly_fee)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">Total recebido</p>
          <p className="text-xl font-bold text-nexus-400">{formatCurrency(totalPago)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">Seguidores</p>
          <p className="text-xl font-bold text-foreground">{latestMetric ? latestMetric.followers_total.toLocaleString("pt-BR") : "—"}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">Engajamento</p>
          <p className="text-xl font-bold text-pink-400">
            {latestMetric && latestMetric.reach > 0
              ? `${((latestMetric.likes + latestMetric.comments + latestMetric.saves) / latestMetric.reach * 100).toFixed(1)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["overview", "financeiro", "instagram"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-all -mb-px", tab === t ? "border-nexus-500 text-nexus-300" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t === "overview" ? "Visão Geral" : t === "financeiro" ? "Financeiro" : "Instagram"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Dados do cliente</h2>
            {editing ? (
              <div className="space-y-3">
                {[
                  { label: "Instagram", key: "instagram_handle", placeholder: "@perfil" },
                  { label: "Google Ads ID", key: "google_ads_account_id", placeholder: "000-000-0000" },
                  { label: "Telegram Chat ID", key: "telegram_chat_id", placeholder: "123456789" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                    <input value={(form as any)[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Mensalidade</label>
                  <input type="number" value={form.monthly_fee || ""} onChange={e => setForm({ ...form, monthly_fee: parseFloat(e.target.value) })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="churned">Encerrado</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Instagram", value: client.instagram_handle || "—", icon: Instagram },
                  { label: "Google Ads", value: client.google_ads_account_id || "—", icon: BarChart3 },
                  { label: "Mensalidade", value: formatCurrency(client.monthly_fee), icon: DollarSign },
                  { label: "Contrato desde", value: client.contract_start ? formatDate(client.contract_start) : "—", icon: TrendingUp },
                ].map(d => (
                  <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <d.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{d.label}</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Notas</h2>
            {editing ? (
              <textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={6} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none" />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">{client.notes || "Nenhuma nota"}</p>
            )}
          </div>
        </div>
      )}

      {tab === "financeiro" && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-accent/20">{["Tipo", "Descrição", "Valor", "Vencimento", "Status"].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">Nenhum lançamento</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-accent/20">
                  <td className="px-5 py-3.5 text-xs text-muted-foreground capitalize">{inv.type === "invoice" ? "Mensalidade" : inv.type}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{inv.description || "—"}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-emerald-400">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                  <td className="px-5 py-3.5"><span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusCor[inv.status])}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "instagram" && (
        <div className="space-y-6">
          {metrics.length === 0 ? (
            <div className="glass rounded-xl p-12 flex flex-col items-center gap-3">
              <Instagram className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma métrica registrada para este cliente</p>
              <Link href="/dados/instagram" className="text-sm text-nexus-400 hover:underline">Registrar dados →</Link>
            </div>
          ) : (
            <>
              <div className="glass rounded-xl p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Crescimento de seguidores</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                    <XAxis dataKey="week_label" tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }} />
                    <Line type="monotone" dataKey="followers_total" stroke="#6366f1" strokeWidth={2} dot={false} name="Seguidores" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-accent/20">{["Semana", "Seguidores", "Novos", "Alcance", "Likes", "Saves", "Engaj."].map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-border">
                    {[...metrics].reverse().map(m => (
                      <tr key={m.id} className="hover:bg-accent/20">
                        <td className="px-4 py-3 text-xs text-foreground">{m.week_label}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{m.followers_total.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-xs text-emerald-400">+{m.followers_new}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{m.reach.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{m.likes.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{m.saves}</td>
                        <td className="px-4 py-3 text-xs text-pink-400">{m.reach > 0 ? `${((m.likes + m.comments + m.saves) / m.reach * 100).toFixed(1)}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
