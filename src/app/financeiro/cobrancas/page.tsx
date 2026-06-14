"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Invoice, Client } from "@/lib/supabase";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, AlertTriangle, CheckCircle2, Clock, DollarSign, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CobrancasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    Promise.all([
      supabase.from("invoices").select("*, clients(name)").order("due_date"),
      supabase.from("clients").select("id,name").eq("status", "active").order("name"),
    ]).then(([inv, cli]) => {
      setInvoices((inv.data as any) || []);
      setClients((cli.data as any) || []);
      setLoading(false);
    });
  }, []);

  const markPaid = async (id: string) => {
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "paid" as const } : i));
    toast.success("Marcado como pago ✓");
  };

  const markOverdue = async (id: string) => {
    await supabase.from("invoices").update({ status: "overdue" }).eq("id", id);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "overdue" as const } : i));
    toast.warning("Marcado como atrasado");
  };

  const filtered = invoices.filter(i => filtro === "todos" || i.status === filtro);

  const stats = {
    total: invoices.reduce((a, i) => a + Number(i.amount), 0),
    paid: invoices.filter(i => i.status === "paid").reduce((a, i) => a + Number(i.amount), 0),
    pending: invoices.filter(i => i.status === "pending").reduce((a, i) => a + Number(i.amount), 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((a, i) => a + Number(i.amount), 0),
  };

  const statusCor: Record<string, string> = {
    pending: "text-orange-400 bg-orange-400/10",
    sent: "text-sky-400 bg-sky-400/10",
    paid: "text-emerald-400 bg-emerald-400/10",
    overdue: "text-red-400 bg-red-400/10",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendente", sent: "Enviada", paid: "Pago", overdue: "Atrasado",
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cobranças</h1>
        <p className="text-sm text-muted-foreground">Mensalidades e faturas dos clientes</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total emitido", value: stats.total, icon: DollarSign, color: "text-nexus-400", bg: "bg-nexus-400/10" },
          { label: "Pago", value: stats.paid, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Pendente", value: stats.pending, icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10" },
          { label: "Inadimplente", value: stats.overdue, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
            </div>
            <p className={cn("text-xl font-bold", s.color)}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        {["todos", "pending", "sent", "paid", "overdue"].map(s => (
          <button key={s} onClick={() => setFiltro(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filtro === s ? "bg-nexus-600/20 text-nexus-300 border border-nexus-500/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
            {s === "todos" ? "Todas" : statusLabel[s]}
          </button>
        ))}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/20">
              {["Cliente", "Tipo", "Valor", "Vencimento", "Status", "Ações"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6}><div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">Nenhuma cobrança encontrada</td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-foreground">{(inv as any).clients?.name}</td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground capitalize">{inv.type === "invoice" ? "Mensalidade" : inv.type}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-foreground">{formatCurrency(inv.amount)}</td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                <td className="px-5 py-3.5"><span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusCor[inv.status])}>{statusLabel[inv.status]}</span></td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    {inv.status !== "paid" && (
                      <button onClick={() => markPaid(inv.id)} className="text-xs text-emerald-400 hover:underline">Pago</button>
                    )}
                    {inv.status === "pending" && (
                      <button onClick={() => markOverdue(inv.id)} className="text-xs text-red-400 hover:underline">Atrasado</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
