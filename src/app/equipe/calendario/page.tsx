"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarPost, Client, TeamMember, StageStatus } from "@/lib/supabase";
import {
  STAGES, TIPOS_POST, STAGE_FIELDS, STAGE_STATUS_LABEL, STAGE_STATUS_STYLE,
  applicableStages, stageStatus, isStageUnlocked, activeStage, isConcluido,
  awaitingApproval, type StageDef,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Plus, X, Check, Loader2, ChevronLeft, ChevronRight,
  Lock, FileText, Play, Image as ImageIcon, Send,
  ThumbsUp, RotateCcw, ExternalLink, LayoutGrid, ListChecks,
  PanelLeftClose, PanelLeftOpen, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameDay, isSameMonth, addMonths, parseISO, isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type View = "calendario" | "filas" | "aprovacoes";

const TIPO_ICON: Record<string, React.ElementType> = {
  reel: Play, story: Play, carrossel: ImageIcon, foto: ImageIcon,
};

export default function CalendarioPage() {
  const [view, setView] = useState<View>("calendario");
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<CalendarPost | null>(null);
  const [filterClient, setFilterClient] = useState("todos");
  const [showSummary, setShowSummary] = useState(true);

  const [form, setForm] = useState({
    client_id: "", title: "", type: "reel",
    scheduled_date: new Date().toISOString().split("T")[0], caption: "",
  });

  const loadAll = () => {
    Promise.all([
      supabase.from("calendar_posts").select("*, clients(name)").order("scheduled_date", { ascending: true }),
      supabase.from("clients").select("id, name").eq("status", "active").order("name"),
      supabase.from("team_members").select("*").eq("status", "active").order("name"),
    ]).then(([p, c, m]) => {
      setPosts((p.data as any) || []);
      setClients((c.data as any) || []);
      setMembers((m.data as any) || []);
      setLoading(false);
    });
  };

  useEffect(loadAll, []);

  const ownerOf = (stage: StageDef): TeamMember | undefined =>
    members.find(m => m.name === stage.ownerName) ||
    members.find(m => m.role === stage.ownerRole);

  const memberName = (id: string | null) => members.find(m => m.id === id)?.name || "—";

  const filteredPosts = posts.filter(p =>
    filterClient === "todos" || p.client_id === filterClient
  );

  const createPost = async () => {
    if (!form.title) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    const payload: any = {
      client_id: form.client_id || null,
      title: form.title,
      type: form.type,
      scheduled_date: form.scheduled_date,
      caption: form.caption || null,
      status: "producao",
      current_stage: "roteiro",
      roteiro_status: "pendente",
      roteiro_by: ownerOf(STAGES[0])?.id || null,
      gravacao_by: ownerOf(STAGES[1])?.id || null,
      edicao_by: ownerOf(STAGES[2])?.id || null,
      publicacao_by: ownerOf(STAGES[3])?.id || null,
    };
    const { error } = await supabase.from("calendar_posts").insert(payload);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setShowForm(false);
    setForm({ client_id: "", title: "", type: "reel", scheduled_date: new Date().toISOString().split("T")[0], caption: "" });
    loadAll();
    toast.success("Post adicionado ao calendário");
  };

  const patchPost = async (id: string, updates: any, successMsg: string) => {
    const { data, error } = await supabase
      .from("calendar_posts").update(updates).eq("id", id)
      .select("*, clients(name)").single();
    if (error) { toast.error("Erro: " + error.message); return; }
    setPosts(prev => prev.map(p => p.id === id ? (data as any) : p));
    if (detail?.id === id) setDetail(data as any);
    toast.success(successMsg);
  };

  const startStage = (post: CalendarPost, stage: StageDef) => {
    const f = STAGE_FIELDS[stage.key];
    patchPost(post.id, { [f.status]: "em_andamento", current_stage: stage.key }, `${stage.label} iniciada`);
  };

  const deliverStage = (post: CalendarPost, stage: StageDef, deliverable: Record<string, string>) => {
    const f = STAGE_FIELDS[stage.key];
    const updates: any = { [f.status]: "entregue", ...deliverable };
    if (f.doneAt) updates[f.doneAt] = new Date().toISOString();
    patchPost(post.id, updates, `${stage.label} entregue — aguardando sua aprovação`);
  };

  const approveStage = (post: CalendarPost, stage: StageDef) => {
    const f = STAGE_FIELDS[stage.key];
    const updates: any = { [f.status]: "aprovado", [f.approvedAt]: new Date().toISOString() };
    const stages = applicableStages(post);
    const idx = stages.findIndex(s => s.key === stage.key);
    const next = stages[idx + 1];
    updates.current_stage = next ? next.key : "concluido";
    if (stage.key === "publicacao") {
      updates.status = "publicado";
      updates.published_at = new Date().toISOString();
    }
    patchPost(post.id, updates, next ? `Aprovado! Passou para ${next.label}` : "Post concluído 🎉");
  };

  const requestChanges = (post: CalendarPost, stage: StageDef) => {
    const f = STAGE_FIELDS[stage.key];
    patchPost(post.id, { [f.status]: "ajustes" }, `Ajustes solicitados em ${stage.label}`);
  };

  const deletePost = async (id: string) => {
    await supabase.from("calendar_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setDetail(null);
    toast.success("Post removido");
  };

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
  });
  const postsOn = (day: Date) =>
    filteredPosts.filter(p => p.scheduled_date && isSameDay(parseISO(p.scheduled_date), day));

  const approvalQueue = filteredPosts.filter(p => awaitingApproval(p));
  const concluidos = filteredPosts.filter(isConcluido).length;
  const emProducao = filteredPosts.length - concluidos;

  // ----- Resumo p/ painel esquerdo -----
  const stageCounts = STAGES.map(stage => ({
    stage,
    count: filteredPosts.filter(p => {
      const stages = applicableStages(p);
      if (!stages.find(s => s.key === stage.key)) return false;
      return isStageUnlocked(p, stage) && stageStatus(p, stage) !== "aprovado";
    }).length,
  }));
  const tipoCounts = TIPOS_POST.map(tp => ({ tp, count: filteredPosts.filter(p => p.type === tp).length }))
    .filter(t => t.count > 0);
  const ajustesCount = filteredPosts.filter(p =>
    applicableStages(p).some(s => stageStatus(p, s) === "ajustes")
  ).length;
  const maxStage = Math.max(1, ...stageCounts.map(s => s.count));

  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== PAINEL RESUMO ESQUERDO ===== */}
      {showSummary && (
        <aside className="w-64 border-r border-border bg-card/40 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-nexus-400" />
              <span className="text-sm font-semibold text-foreground">Resumo</span>
            </div>
            <button onClick={() => setShowSummary(false)} className="p-1 rounded hover:bg-accent transition-colors" title="Esconder resumo">
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Totais */}
          <div className="p-4 grid grid-cols-2 gap-2 border-b border-border">
            <div className="rounded-lg bg-accent/40 p-2.5">
              <p className="text-lg font-bold text-foreground">{filteredPosts.length}</p>
              <p className="text-[10px] text-muted-foreground">Posts no total</p>
            </div>
            <div className="rounded-lg bg-emerald-400/10 p-2.5">
              <p className="text-lg font-bold text-emerald-400">{concluidos}</p>
              <p className="text-[10px] text-muted-foreground">Concluídos</p>
            </div>
            <div className="rounded-lg bg-nexus-400/10 p-2.5">
              <p className="text-lg font-bold text-nexus-400">{emProducao}</p>
              <p className="text-[10px] text-muted-foreground">Em produção</p>
            </div>
            <div className="rounded-lg bg-orange-400/10 p-2.5">
              <p className="text-lg font-bold text-orange-400">{approvalQueue.length}</p>
              <p className="text-[10px] text-muted-foreground">P/ aprovar</p>
            </div>
          </div>

          {/* Carga por etapa */}
          <div className="p-4 border-b border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Fila por etapa / responsável</p>
            <div className="space-y-2.5">
              {stageCounts.map(({ stage, count }) => (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                      <span className="text-xs text-foreground">{stage.label}</span>
                      <span className="text-[10px] text-muted-foreground">{stage.ownerName}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-accent/60 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxStage) * 100}%`, background: stage.color }} />
                  </div>
                </div>
              ))}
            </div>
            {ajustesCount > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-red-400">
                <RotateCcw className="w-3 h-3" /> {ajustesCount} em ajustes
              </div>
            )}
          </div>

          {/* Por tipo */}
          <div className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Por tipo de conteúdo</p>
            <div className="space-y-2">
              {tipoCounts.map(({ tp, count }) => {
                const Icon = TIPO_ICON[tp] || FileText;
                return (
                  <div key={tp} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground capitalize">{tp}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{count}</span>
                  </div>
                );
              })}
              {tipoCounts.length === 0 && <p className="text-[11px] text-muted-foreground">Sem posts</p>}
            </div>
          </div>
        </aside>
      )}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!showSummary && (
              <button onClick={() => setShowSummary(true)} className="p-1.5 rounded-lg border border-border hover:bg-accent transition-colors mr-1" title="Mostrar resumo">
                <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <CalendarDays className="w-5 h-5 text-violet-400" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Calendário & Produção</h1>
              <p className="text-sm text-muted-foreground">
                {emProducao} em produção · {concluidos} concluídos · {approvalQueue.length} aguardando sua aprovação
              </p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Novo Post
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-xs text-foreground font-medium">{s.label}</span>
                <span className="text-[10px] text-muted-foreground">· {s.ownerName}</span>
                {s.onlyTypes && <span className="text-[9px] text-muted-foreground">(reel/story)</span>}
              </div>
              {i < STAGES.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 border border-border rounded-lg p-0.5">
            {([
              { k: "calendario", label: "Calendário", icon: LayoutGrid },
              { k: "filas", label: "Filas por etapa", icon: ListChecks },
              { k: "aprovacoes", label: `Aprovações${approvalQueue.length ? ` (${approvalQueue.length})` : ""}`, icon: ThumbsUp },
            ] as const).map(t => (
              <button key={t.k} onClick={() => setView(t.k)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all", view === t.k ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground")}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
            <option value="todos">Todos os clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {showForm && (
          <div className="glass rounded-xl p-5 border border-nexus-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Novo Post</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-accent transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">Título / tema *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Reel - 5 mitos sobre ortodontia" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Cliente</label>
                <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                  <option value="">Selecionar...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                  {TIPOS_POST.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Data de publicação</label>
                <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
              </div>
              <div className="col-span-3">
                <label className="block text-xs text-muted-foreground mb-1.5">Briefing / observação inicial</label>
                <input value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} placeholder="Direção para o roteiro..." className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              O post entra direto na fila de roteiro do Gerval. {form.type === "reel" || form.type === "story" ? "Passará por Roteiro → Gravação → Edição → Publicação." : "Carrossel/foto pulam a gravação: Roteiro → Edição → Publicação."}
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={createPost} disabled={saving} className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Criar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {view === "calendario" && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground capitalize">{format(month, "MMMM yyyy", { locale: ptBR })}</h2>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setMonth(addMonths(month, -1))} className="p-1.5 rounded-lg border border-border hover:bg-accent transition-colors"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => setMonth(startOfMonth(new Date()))} className="px-2.5 py-1.5 text-xs text-nexus-400 hover:underline">Hoje</button>
                    <button onClick={() => setMonth(addMonths(month, 1))} className="p-1.5 rounded-lg border border-border hover:bg-accent transition-colors"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                    <div key={d} className="text-center text-[10px] font-medium text-muted-foreground uppercase py-2">{d}</div>
                  ))}
                  {calendarDays.map(day => {
                    const dayPosts = postsOn(day);
                    return (
                      <div key={day.toISOString()} className={cn("min-h-[96px] p-1.5 rounded-lg border border-border/30 space-y-1", isSameMonth(day, month) ? "bg-card/40" : "bg-transparent opacity-40", isToday(day) && "ring-1 ring-nexus-500/40")}>
                        <div className={cn("text-[11px] font-medium", isToday(day) ? "text-nexus-400" : "text-muted-foreground")}>{format(day, "d")}</div>
                        {dayPosts.map(post => {
                          const Icon = TIPO_ICON[post.type] || FileText;
                          return (
                            <button key={post.id} onClick={() => setDetail(post)} className="w-full text-left p-1.5 rounded-md bg-accent/60 hover:bg-accent transition-colors">
                              <div className="flex items-center gap-1 mb-1">
                                <Icon className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-[10px] font-medium text-foreground truncate">{post.title}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {applicableStages(post).map(s => {
                                  const st = stageStatus(post, s);
                                  return (
                                    <div key={s.key} title={`${s.label}: ${STAGE_STATUS_LABEL[st]}`}
                                      className="flex-1 h-1 rounded-full"
                                      style={{ background: st === "aprovado" ? s.color : st === "entregue" ? "#f9731680" : st === "em_andamento" ? "#0ea5e980" : st === "ajustes" ? "#ef444480" : "#ffffff14" }}
                                    />
                                  );
                                })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "filas" && (
              <div className="grid grid-cols-4 gap-4">
                {STAGES.map(stage => {
                  const queue = filteredPosts.filter(p => {
                    const stages = applicableStages(p);
                    if (!stages.find(s => s.key === stage.key)) return false;
                    return isStageUnlocked(p, stage) && stageStatus(p, stage) !== "aprovado";
                  });
                  return (
                    <div key={stage.key} className="rounded-xl border border-border bg-card/40">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                          <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{stage.ownerName} · {queue.length}</span>
                      </div>
                      <div className="p-3 space-y-2 min-h-[120px]">
                        {queue.length === 0 ? (
                          <div className="h-16 flex items-center justify-center rounded-lg border border-dashed border-border">
                            <span className="text-[11px] text-muted-foreground">Fila vazia</span>
                          </div>
                        ) : queue.map(post => {
                          const st = stageStatus(post, stage);
                          const Icon = TIPO_ICON[post.type] || FileText;
                          return (
                            <button key={post.id} onClick={() => setDetail(post)} className="w-full text-left glass rounded-lg p-3 hover:border-nexus-500/30 border border-transparent transition-all">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Icon className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-medium text-foreground truncate">{post.title}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">{post.clients?.name || "—"}</span>
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full", STAGE_STATUS_STYLE[st])}>
                                  {st === "entregue" ? "p/ aprovar" : st === "ajustes" ? "ajustes" : st === "em_andamento" ? "fazendo" : "novo"}
                                </span>
                              </div>
                              {post.scheduled_date && (
                                <p className="text-[10px] text-muted-foreground mt-1">📅 {format(parseISO(post.scheduled_date), "dd/MM")}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === "aprovacoes" && (
              <div className="space-y-3">
                {approvalQueue.length === 0 ? (
                  <div className="glass rounded-xl py-16 flex flex-col items-center gap-3">
                    <ThumbsUp className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Nada aguardando aprovação no momento</p>
                  </div>
                ) : approvalQueue.map(post => {
                  const stage = awaitingApproval(post)!;
                  const f = STAGE_FIELDS[stage.key];
                  const Icon = TIPO_ICON[post.type] || FileText;
                  return (
                    <div key={post.id} className="glass rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: stage.color + "22" }}>
                        <Icon className="w-5 h-5" style={{ color: stage.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.clients?.name || "—"} · Etapa <span style={{ color: stage.color }}>{stage.label}</span> entregue por {memberName(post[f.byField as keyof CalendarPost] as string)}
                        </p>
                      </div>
                      <button onClick={() => setDetail(post)} className="px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Ver entrega</button>
                      <button onClick={() => requestChanges(post, stage)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" /> Ajustes
                      </button>
                      <button onClick={() => approveStage(post, stage)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" /> Aprovar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {detail && (
        <PipelinePanel
          post={detail}
          onClose={() => setDetail(null)}
          onStart={startStage}
          onDeliver={deliverStage}
          onApprove={approveStage}
          onRequestChanges={requestChanges}
          onDelete={deletePost}
          memberName={memberName}
        />
      )}
    </div>
  );
}

function PipelinePanel({
  post, onClose, onStart, onDeliver, onApprove, onRequestChanges, onDelete, memberName,
}: {
  post: CalendarPost;
  onClose: () => void;
  onStart: (p: CalendarPost, s: StageDef) => void;
  onDeliver: (p: CalendarPost, s: StageDef, d: Record<string, string>) => void;
  onApprove: (p: CalendarPost, s: StageDef) => void;
  onRequestChanges: (p: CalendarPost, s: StageDef) => void;
  onDelete: (id: string) => void;
  memberName: (id: string | null) => string;
}) {
  const stages = applicableStages(post);

  return (
    <div className="w-[420px] border-l border-border bg-card overflow-y-auto flex-shrink-0">
      <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{post.title}</h2>
          <p className="text-xs text-muted-foreground">
            {post.clients?.name || "Sem cliente"} · {post.type}
            {post.scheduled_date && ` · ${format(parseISO(post.scheduled_date), "dd 'de' MMM", { locale: ptBR })}`}
          </p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors flex-shrink-0"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {post.caption && (
        <div className="px-5 py-3 border-b border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Briefing</p>
          <p className="text-xs text-foreground leading-relaxed">{post.caption}</p>
        </div>
      )}

      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-1">
          {stages.map(s => {
            const st = stageStatus(post, s);
            return (
              <div key={s.key} className="flex-1">
                <div className="h-1.5 rounded-full" style={{ background: st === "aprovado" ? s.color : "#ffffff14" }} />
                <p className="text-[9px] text-center mt-1 text-muted-foreground">{s.short}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {stages.map(stage => (
          <StageCard
            key={stage.key}
            post={post} stage={stage}
            onStart={onStart} onDeliver={onDeliver}
            onApprove={onApprove} onRequestChanges={onRequestChanges}
            memberName={memberName}
          />
        ))}
      </div>

      <div className="p-5 border-t border-border">
        <button onClick={() => onDelete(post.id)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition-colors">
          <X className="w-4 h-4" /> Remover post
        </button>
      </div>
    </div>
  );
}

function StageCard({
  post, stage, onStart, onDeliver, onApprove, onRequestChanges, memberName,
}: {
  post: CalendarPost; stage: StageDef;
  onStart: (p: CalendarPost, s: StageDef) => void;
  onDeliver: (p: CalendarPost, s: StageDef, d: Record<string, string>) => void;
  onApprove: (p: CalendarPost, s: StageDef) => void;
  onRequestChanges: (p: CalendarPost, s: StageDef) => void;
  memberName: (id: string | null) => string;
}) {
  const st = stageStatus(post, stage);
  const unlocked = isStageUnlocked(post, stage);
  const f = STAGE_FIELDS[stage.key];
  const [text, setText] = useState(post.roteiro_text || "");
  const [url, setUrl] = useState("");

  const ownerId = post[f.byField as keyof CalendarPost] as string | null;
  const locked = !unlocked && st === "pendente";

  const savedText = stage.key === "roteiro" ? post.roteiro_text : null;
  const savedUrl =
    stage.key === "roteiro" ? post.roteiro_url :
    stage.key === "gravacao" ? post.gravacao_url :
    stage.key === "edicao" ? post.edicao_url :
    post.post_link;

  return (
    <div className={cn("rounded-xl border p-4 transition-all", locked ? "border-border/40 opacity-50" : "border-border", st === "entregue" && "border-orange-500/30", st === "aprovado" && "border-emerald-500/20")}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
          <span className="text-sm font-semibold text-foreground">{stage.label}</span>
          {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STAGE_STATUS_STYLE[st])}>
          {STAGE_STATUS_LABEL[st]}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">Responsável: {memberName(ownerId)}</p>

      {locked ? (
        <p className="text-[11px] text-muted-foreground">Aguardando a etapa anterior ser aprovada.</p>
      ) : (
        <>
          {savedText && (
            <div className="mb-2 p-2.5 rounded-lg bg-accent/50 max-h-32 overflow-y-auto">
              <p className="text-[10px] text-muted-foreground mb-1">Roteiro</p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{savedText}</p>
            </div>
          )}
          {savedUrl && (
            <a href={savedUrl} target="_blank" rel="noopener noreferrer" className="mb-2 flex items-center gap-1.5 text-xs text-nexus-400 hover:underline">
              <ExternalLink className="w-3 h-3" /> {stage.key === "publicacao" ? "Ver post publicado" : "Abrir arquivo entregue"}
            </a>
          )}

          {st === "pendente" && (
            <button onClick={() => onStart(post, stage)} className="w-full py-2 rounded-lg bg-nexus-600 hover:bg-nexus-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Iniciar etapa
            </button>
          )}

          {(st === "em_andamento" || st === "ajustes") && (
            <div className="space-y-2">
              {stage.key === "roteiro" && (
                <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Cole o roteiro aqui (ou só anexe o link abaixo)..." className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none" />
              )}
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder={stage.key === "publicacao" ? "Link do post publicado..." : stage.key === "roteiro" ? "Link do roteiro (opcional)..." : "Link do arquivo (Drive, R2...)"} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
              <button
                onClick={() => {
                  const deliverable: Record<string, string> = {};
                  if (stage.key === "roteiro") {
                    if (!text && !url) { toast.error("Preencha o roteiro ou o link"); return; }
                    if (text) deliverable.roteiro_text = text;
                    if (url) deliverable.roteiro_url = url;
                  } else {
                    if (!url) { toast.error("Informe o link do " + (stage.key === "publicacao" ? "post" : "arquivo")); return; }
                    deliverable[f.deliverable[0]] = url;
                  }
                  onDeliver(post, stage, deliverable);
                }}
                className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> {stage.key === "publicacao" ? "Marcar como publicado" : "Entregar para aprovação"}
              </button>
            </div>
          )}

          {st === "entregue" && (
            <div className="flex gap-2">
              <button onClick={() => onRequestChanges(post, stage)} className="flex-1 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Pedir ajustes
              </button>
              <button onClick={() => onApprove(post, stage)} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Aprovar
              </button>
            </div>
          )}

          {st === "aprovado" && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Etapa aprovada
            </div>
          )}
        </>
      )}
    </div>
  );
}
