"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Invoice, Expense, Client } from "@/lib/supabase";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowUpRight, ArrowDownRight, Plus, Loader2, Check,
  DollarSign, TrendingUp, TrendingDown, Trash2,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIAS = ["equipe", "ferramentas", "trafego", "infra", "outros"];

export default function ReceitasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"receitas" | "gastos">("receitas");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    client_id: "", type: "invoice", amount: "", status: "pending", due_date: "", description: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    description: "", category: "outros", amount: "", date: new Date().toISOString().split("T")[0], recurring: false, notes: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("invoices").select("*, clients(name)").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
      supabase.from("clients").select("id,name").eq("status", "active").order("name"),
    ]).then(([inv, exp, cli]) => {
      setInvoices((inv.data as any) || []);
      setExpenses(exp.data || []);
      setClients(cli.data || []);
      setLoading(false);
    });
  }, []);

  const totalReceitas = invoices.filter(i => i.status === "paid").reduce((a, i) => a + Number(i.amount), 0);
  const totalGastos = expenses.reduce((a, e) => a + Number(e.amount), 0);

  const saveInvoice = async () => {
    if (!invoiceForm.client_id || !invoiceForm.amount) { toast.error("Campos obrigatórios"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("invoices")
      .insert({ ...invoiceForm, amount: parseFloat(invoiceForm.amount) })
      .select("*, clients(name)").single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    setInvoices(prev => [data as any, ...prev]);
    setInvoiceForm({ client_id: "", type: "invoice", amount: "", status: "pending", due_date: "", description: "" });
    setShowForm(false);
    toast.success("Receita salva");
  };

  const saveExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) { toast.error("Campos obrigatórios"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("expenses")
      .insert({ ...expenseForm, amount: parseFloat(expenseForm.amount) }).select().single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    setExpenses(prev => [data as any, ...prev]);
    setExpenseForm({ description: "", category: "outros", amount: "", date: new Date().toISOString().split("T")[0], recurring: false, notes: "" });
    setShowForm(false);
    toast.success("Gasto registrado");
  };

  const markPaid = async (id: string) => {
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "paid" as const, paid_at: new Date().toISOString() } : i));
    toast.success("Marcado como pago");
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success("Removido");
  };

  const statusCor: Record<string, string> = {
    pending: "text-orange-400 bg-orange-400/10",
    sent: "text-sky-400 bg-sky-400/10",
    paid: "text-emerald-400 bg-emerald-400/10",
    overdue: "text-red-400 bg-red-400/10",
  };

  const catCor: Record<string, string> = {
    equipe: "text-nexus-400 bg-nexus-400/10",
    ferramentas: "text-violet-400 bg-violet-400/10",
    trafego: "text-sky-400 bg-sky-400/10",
    infra: "text-emerald-400 bg-emerald-400/10",
    outros: "text-gray-400 bg-gray-400/10",
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Receitas & Gastos</h1>
          <p className="text-sm text-muted-foreground">Lançamentos financeiros detalhados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Receitas pagas</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Gastos totais</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalGastos)}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Lucro líquido</p>
          <p className={cn("text-2xl font-bold", totalReceitas - totalGastos >= 0 ? "text-nexus-400" : "text-red-400")}>
            {formatCurrency(totalReceitas - totalGastos)}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-6 border border-nexus-500/20 space-y-4">
          <div className="flex gap-3 mb-2">
            <button onClick={() => setTab("receitas")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", tab === "receitas" ? "bg-emerald-400/20 text-emerald-300" : "text-muted-foreground")}>Receita</button>
            <button onClick={() => setTab("gastos")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", tab === "gastos" ? "bg-red-400/20 text-red-300" : "text-muted-foreground")}>Gasto</button>
          </div>
          {tab === "receitas" ? (
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs text-muted-foreground mb-1.5">Cliente *</label>
                <select value={invoiceForm.client_id} onChange={e => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                  <option value="">Selecionar...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
                <select value={invoiceForm.type} onChange={e => setInvoiceForm({ ...invoiceForm, type: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                  <option value="invoice">Mensalidade</option>
                  <option value="proposal">Proposta</option>
                  <option value="receipt">Recibo</option>
                </select></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Valor *</label>
                <input type="number" value={invoiceForm.amount} onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} placeholder="0,00" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Status</label>
                <select value={invoiceForm.status} onChange={e => setInvoiceForm({ ...invoiceForm, status: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                  <option value="pending">Pendente</option><option value="sent">Enviada</option><option value="paid">Pago</option><option value="overdue">Atrasado</option>
                </select></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Vencimento</label>
                <input type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Descrição</label>
                <input value={invoiceForm.description} onChange={e => setInvoiceForm({ ...invoiceForm, description: e.target.value })} placeholder="Obs..." className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" /></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1.5">Descrição *</label>
                <input value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ex: Salário equipe, Adobe CC..." className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Valor *</label>
                <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0,00" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Categoria</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Data</label>
                <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" /></div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="rec" checked={expenseForm.recurring} onChange={e => setExpenseForm({ ...expenseForm, recurring: e.target.checked })} className="w-4 h-4 rounded" />
                <label htmlFor="rec" className="text-sm text-foreground cursor-pointer">Recorrente (mensal)</label>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={tab === "receitas" ? saveInvoice : saveExpense} disabled={saving} className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["receitas", "gastos"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 text-sm font-medium capitalize border-b-2 transition-all -mb-px", tab === t ? "border-nexus-500 text-nexus-300" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t === "receitas" ? "Receitas" : "Gastos"}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/20">
              {tab === "receitas"
                ? ["Cliente", "Tipo", "Descrição", "Valor", "Vencimento", "Status", ""].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)
                : ["Descrição", "Categoria", "Data", "Valor", ""].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7}><div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div></td></tr>
            ) : tab === "receitas" ? (
              invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-foreground">{(inv as any).clients?.name}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground capitalize">{inv.type}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{inv.description || "—"}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-emerald-400">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                  <td className="px-5 py-3.5"><span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", statusCor[inv.status])}>{inv.status}</span></td>
                  <td className="px-5 py-3.5">
                    {inv.status !== "paid" && (
                      <button onClick={() => markPaid(inv.id)} className="text-xs text-emerald-400 hover:underline">Marcar pago</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-foreground">{exp.description}</td>
                  <td className="px-5 py-3.5"><span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", catCor[exp.category] || "text-muted-foreground bg-accent")}>{exp.category}</span></td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{formatDate(exp.date)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-red-400">{formatCurrency(exp.amount)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => deleteExpense(exp.id)} className="p-1 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
