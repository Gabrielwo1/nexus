"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { TeamMember } from "@/lib/supabase";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText, Plus, Upload, Download, Eye, Trash2,
  Check, Loader2, CheckCircle2, XCircle, RefreshCw,
  Clock, Receipt, ChevronRight, X,
} from "lucide-react";
import { toast } from "sonner";

type Contract = {
  id: string;
  team_member_id: string;
  title: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  value: number | null;
  recurrence: string;
  file_url: string | null;
  file_name: string | null;
  notes: string | null;
  signed_at: string | null;
  created_at: string;
  team_members?: { name: string; role: string };
};

type NotaFiscal = {
  id: string;
  team_member_id: string | null;
  client_id: string | null;
  contract_id: string | null;
  number: string | null;
  competencia: string;
  value: number;
  status: string;
  file_url: string | null;
  file_name: string | null;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  team_members?: { name: string };
  clients?: { name: string };
};

const TIPOS_CONTRATO = ["pj", "clt", "freelancer", "estagio", "parceria"];
const TIPOS_LABEL: Record<string, string> = {
  pj: "Pessoa Jurídica", clt: "CLT", freelancer: "Freelancer",
  estagio: "Estágio", parceria: "Parceria",
};
const STATUS_CONTRATO = ["vigente", "encerrado", "em_renovacao", "cancelado"];
const STATUS_NF = ["pendente", "emitida", "paga", "cancelada"];

const statusContratoStyle: Record<string, string> = {
  vigente: "text-emerald-400 bg-emerald-400/10",
  encerrado: "text-gray-400 bg-gray-400/10",
  em_renovacao: "text-orange-400 bg-orange-400/10",
  cancelado: "text-red-400 bg-red-400/10",
};

const statusNfStyle: Record<string, string> = {
  pendente: "text-orange-400 bg-orange-400/10",
  emitida: "text-sky-400 bg-sky-400/10",
  paga: "text-emerald-400 bg-emerald-400/10",
  cancelada: "text-red-400 bg-red-400/10",
};

export default function ContratosPage() {
  const [tab, setTab] = useState<"contratos" | "notas">("contratos");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Contract | null>(null);

  const [contractForm, setContractForm] = useState({
    team_member_id: "", title: "", type: "pj", status: "vigente",
    start_date: new Date().toISOString().split("T")[0], end_date: "",
    value: "", recurrence: "mensal", file_url: "", file_name: "", notes: "", signed_at: "",
  });

  const [nfForm, setNfForm] = useState({
    team_member_id: "", client_id: "", contract_id: "",
    number: "", competencia: "", value: "", status: "pendente",
    file_url: "", file_name: "", due_date: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("contracts").select("*, team_members(name, role)").order("created_at", { ascending: false }),
      supabase.from("notas_fiscais").select("*, team_members(name), clients(name)").order("created_at", { ascending: false }),
      supabase.from("team_members").select("*").eq("status", "active").order("name"),
      supabase.from("clients").select("id, name").eq("status", "active").order("name"),
    ]).then(([c, n, m, cl]) => {
      setContracts((c.data as any) || []);
      setNotas((n.data as any) || []);
      setMembers((m.data as any) || []);
      setClients((cl.data as any) || []);
      setLoading(false);
    });
  }, []);

  const filteredContracts = contracts.filter(c => {
    if (selectedMember !== "todos" && c.team_member_id !== selectedMember) return false;
    if (selectedStatus !== "todos" && c.status !== selectedStatus) return false;
    return true;
  });

  const filteredNotas = notas.filter(n => {
    if (selectedMember !== "todos" && n.team_member_id !== selectedMember) return false;
    if (selectedStatus !== "todos" && n.status !== selectedStatus) return false;
    return true;
  });

  const saveContract = async () => {
    if (!contractForm.team_member_id || !contractForm.title) {
      toast.error("Membro e título são obrigatórios");
      return;
    }
    setSaving(true);
    const payload = {
      ...contractForm,
      value: contractForm.value ? parseFloat(contractForm.value) : null,
      end_date: contractForm.end_date || null,
      signed_at: contractForm.signed_at || null,
      file_url: contractForm.file_url || null,
      file_name: contractForm.file_name || null,
    };
    const { data, error } = await supabase
      .from("contracts").insert(payload)
      .select("*, team_members(name, role)").single();
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setContracts(prev => [data as any, ...prev]);
    setShowForm(false);
    setContractForm({ team_member_id: "", title: "", type: "pj", status: "vigente", start_date: new Date().toISOString().split("T")[0], end_date: "", value: "", recurrence: "mensal", file_url: "", file_name: "", notes: "", signed_at: "" });
    toast.success("Contrato salvo com sucesso");
  };

  const saveNF = async () => {
    if (!nfForm.competencia || !nfForm.value) {
      toast.error("Competência e valor são obrigatórios");
      return;
    }
    setSaving(true);
    const payload = {
      ...nfForm,
      value: parseFloat(nfForm.value),
      team_member_id: nfForm.team_member_id || null,
      client_id: nfForm.client_id || null,
      contract_id: nfForm.contract_id || null,
      due_date: nfForm.due_date || null,
      file_url: nfForm.file_url || null,
      file_name: nfForm.file_name || null,
    };
    const { data, error } = await supabase
      .from("notas_fiscais").insert(payload)
      .select("*, team_members(name), clients(name)").single();
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setNotas(prev => [data as any, ...prev]);
    setShowForm(false);
    setNfForm({ team_member_id: "", client_id: "", contract_id: "", number: "", competencia: "", value: "", status: "pendente", file_url: "", file_name: "", due_date: "", notes: "" });
    toast.success("Nota fiscal registrada");
  };

  const markNFPaid = async (id: string) => {
    await supabase.from("notas_fiscais").update({ status: "paga", paid_at: new Date().toISOString() }).eq("id", id);
    setNotas(prev => prev.map(n => n.id === id ? { ...n, status: "paga" } : n));
    toast.success("NF marcada como paga");
  };

  const deleteContract = async (id: string) => {
    await supabase.from("contracts").delete().eq("id", id);
    setContracts(prev => prev.filter(c => c.id !== id));
    setDetail(null);
    toast.success("Contrato removido");
  };

  // Stats
  const activeContracts = contracts.filter(c => c.status === "vigente").length;
  const totalMensal = contracts.filter(c => c.status === "vigente" && c.recurrence === "mensal").reduce((a, c) => a + Number(c.value || 0), 0);
  const nfPendentes = notas.filter(n => n.status === "pendente").length;
  const nfPagas = notas.filter(n => n.status === "paga").reduce((a, n) => a + Number(n.value), 0);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-nexus-400" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestão de Contratos</h1>
              <p className="text-sm text-muted-foreground">Contratos e notas fiscais da equipe</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {tab === "contratos" ? "Novo Contrato" : "Nova NF"}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Contratos vigentes", value: activeContracts.toString(), color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
            { label: "Custo mensal equipe", value: formatCurrency(totalMensal), color: "text-nexus-400", bg: "bg-nexus-400/10", icon: Receipt },
            { label: "NFs pendentes", value: nfPendentes.toString(), color: "text-orange-400", bg: "bg-orange-400/10", icon: Clock },
            { label: "NFs pagas (mês)", value: formatCurrency(nfPagas), color: "text-sky-400", bg: "bg-sky-400/10", icon: CheckCircle2 },
          ].map(k => (
            <div key={k.label} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</p>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", k.bg)}>
                  <k.icon className={cn("w-4 h-4", k.color)} />
                </div>
              </div>
              <p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass rounded-xl p-6 border border-nexus-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {tab === "contratos" ? "Novo Contrato" : "Nova Nota Fiscal"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {tab === "contratos" ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Membro *</label>
                  <select value={contractForm.team_member_id} onChange={e => setContractForm({ ...contractForm, team_member_id: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                    <option value="">Selecionar...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1.5">Título do contrato *</label>
                  <input value={contractForm.title} onChange={e => setContractForm({ ...contractForm, title: e.target.value })} placeholder="Ex: Contrato PJ - Edição de Vídeos 2026" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
                  <select value={contractForm.type} onChange={e => setContractForm({ ...contractForm, type: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                    {TIPOS_CONTRATO.map(t => <option key={t} value={t}>{TIPOS_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Valor (R$)</label>
                  <input type="number" value={contractForm.value} onChange={e => setContractForm({ ...contractForm, value: e.target.value })} placeholder="3500" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Recorrência</label>
                  <select value={contractForm.recurrence} onChange={e => setContractForm({ ...contractForm, recurrence: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                    <option value="mensal">Mensal</option>
                    <option value="semanal">Semanal</option>
                    <option value="por_entrega">Por entrega</option>
                    <option value="unico">Único</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Início *</label>
                  <input type="date" value={contractForm.start_date} onChange={e => setContractForm({ ...contractForm, start_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Término</label>
                  <input type="date" value={contractForm.end_date} onChange={e => setContractForm({ ...contractForm, end_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Assinado em</label>
                  <input type="date" value={contractForm.signed_at} onChange={e => setContractForm({ ...contractForm, signed_at: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">URL do arquivo assinado</label>
                  <input value={contractForm.file_url} onChange={e => setContractForm({ ...contractForm, file_url: e.target.value })} placeholder="https://drive.google.com/..." className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-muted-foreground mb-1.5">Notas internas</label>
                  <textarea value={contractForm.notes} onChange={e => setContractForm({ ...contractForm, notes: e.target.value })} placeholder="Observações sobre o contrato..." rows={2} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Membro</label>
                  <select value={nfForm.team_member_id} onChange={e => setNfForm({ ...nfForm, team_member_id: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                    <option value="">Selecionar...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Cliente</label>
                  <select value={nfForm.client_id} onChange={e => setNfForm({ ...nfForm, client_id: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                    <option value="">Selecionar...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Número da NF</label>
                  <input value={nfForm.number} onChange={e => setNfForm({ ...nfForm, number: e.target.value })} placeholder="Ex: 000245" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Competência *</label>
                  <input value={nfForm.competencia} onChange={e => setNfForm({ ...nfForm, competencia: e.target.value })} placeholder="Ex: Junho/2026" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Valor (R$) *</label>
                  <input type="number" value={nfForm.value} onChange={e => setNfForm({ ...nfForm, value: e.target.value })} placeholder="3500" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Vencimento</label>
                  <input type="date" value={nfForm.due_date} onChange={e => setNfForm({ ...nfForm, due_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
                  <select value={nfForm.status} onChange={e => setNfForm({ ...nfForm, status: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                    {STATUS_NF.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1.5">URL do arquivo PDF</label>
                  <input value={nfForm.file_url} onChange={e => setNfForm({ ...nfForm, file_url: e.target.value })} placeholder="https://..." className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-muted-foreground mb-1.5">Notas</label>
                  <textarea value={nfForm.notes} onChange={e => setNfForm({ ...nfForm, notes: e.target.value })} placeholder="Observações..." rows={2} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={tab === "contratos" ? saveContract : saveNF} disabled={saving} className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 border border-border rounded-lg p-0.5">
            <button onClick={() => { setTab("contratos"); setSelectedStatus("todos"); }} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", tab === "contratos" ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground")}>
              Contratos ({contracts.length})
            </button>
            <button onClick={() => { setTab("notas"); setSelectedStatus("todos"); }} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", tab === "notas" ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground")}>
              Notas Fiscais ({notas.length})
            </button>
          </div>
          <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
            <option value="todos">Todos os membros</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="flex gap-1.5">
            {(tab === "contratos" ? ["todos", ...STATUS_CONTRATO] : ["todos", ...STATUS_NF]).map(s => (
              <button key={s} onClick={() => setSelectedStatus(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all", selectedStatus === s ? "bg-nexus-600/20 text-nexus-300 border border-nexus-500/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
                {s === "todos" ? "Todos" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela Contratos */}
        {tab === "contratos" && (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {["Membro", "Contrato", "Tipo", "Valor", "Recorrência", "Início", "Término", "Status", "Arquivo", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={9}><div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div></td></tr>
                ) : filteredContracts.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-muted-foreground text-sm">Nenhum contrato encontrado</td></tr>
                ) : filteredContracts.map(c => (
                  <tr key={c.id} className="hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => setDetail(c)}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {c.team_members?.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{c.team_members?.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{c.team_members?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-foreground font-medium max-w-[180px]">
                      <p className="truncate">{c.title}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-nexus-400/10 text-nexus-300 font-medium uppercase">{c.type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-emerald-400">
                      {c.value ? formatCurrency(c.value) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground capitalize">{c.recurrence}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{c.end_date ? formatDate(c.end_date) : "Indeterminado"}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", statusContratoStyle[c.status])}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {c.file_url ? (
                        <a href={c.file_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-nexus-400 hover:underline">
                          <Download className="w-3 h-3" /> Baixar
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem arquivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela NFs */}
        {tab === "notas" && (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {["Membro", "Cliente", "NF Nº", "Competência", "Valor", "Vencimento", "Status", "Arquivo", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={9}><div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div></td></tr>
                ) : filteredNotas.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-muted-foreground text-sm">Nenhuma nota fiscal encontrada</td></tr>
                ) : filteredNotas.map(nf => (
                  <tr key={nf.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                          {nf.team_members?.name?.[0] || "?"}
                        </div>
                        <span className="text-xs text-foreground">{nf.team_members?.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{nf.clients?.name || "—"}</td>
                    <td className="px-4 py-3.5 text-xs font-mono text-foreground">{nf.number || "—"}</td>
                    <td className="px-4 py-3.5 text-xs text-foreground font-medium">{nf.competencia}</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-emerald-400">{formatCurrency(nf.value)}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{nf.due_date ? formatDate(nf.due_date) : "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", statusNfStyle[nf.status])}>
                        {nf.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        {nf.file_url && (
                          <a href={nf.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-nexus-400 hover:underline">
                            <Download className="w-3 h-3" /> Baixar
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {nf.status !== "paga" && (
                        <button onClick={() => markNFPaid(nf.id)} className="text-xs text-emerald-400 hover:underline whitespace-nowrap">
                          Marcar paga
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel lateral — detalhe do contrato */}
      {detail && (
        <div className="w-80 border-l border-border bg-card overflow-y-auto flex-shrink-0">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Detalhes do Contrato</h2>
            <button onClick={() => setDetail(null)} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center text-white font-bold">
                {detail.team_members?.name?.[0] || "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{detail.team_members?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{detail.team_members?.role}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Título</p>
                <p className="text-sm text-foreground font-medium">{detail.title}</p>
              </div>
              {[
                { label: "Tipo", value: TIPOS_LABEL[detail.type] || detail.type },
                { label: "Valor", value: detail.value ? formatCurrency(detail.value) : "—" },
                { label: "Recorrência", value: detail.recurrence },
                { label: "Início", value: formatDate(detail.start_date) },
                { label: "Término", value: detail.end_date ? formatDate(detail.end_date) : "Indeterminado" },
                { label: "Assinado em", value: detail.signed_at ? formatDate(detail.signed_at) : "—" },
              ].map(d => (
                <div key={d.label} className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                  <span className="text-xs text-foreground font-medium capitalize">{d.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", statusContratoStyle[detail.status])}>
                  {detail.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {detail.notes && (
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-xs text-foreground leading-relaxed">{detail.notes}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {detail.file_url && (
                <a href={detail.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-nexus-500/30 text-nexus-300 hover:bg-nexus-500/10 text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" /> Baixar contrato assinado
                </a>
              )}
              <button
                onClick={() => deleteContract(detail.id)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Remover contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
