"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarPost, TeamMember } from "@/lib/supabase";
import {
  STAGES, STAGE_FIELDS, FORMATOS, PARTICIPANTES, findTag,
  applicableStages, stageStatus, toPreviewUrl, type StageDef,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, Search, ExternalLink, Loader2, ThumbsUp,
  RotateCcw, FileType2, Film, Send, X, Inbox, User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Item da fila: um post + a etapa que está aguardando aprovação */
type QueueItem = { post: CalendarPost; stage: StageDef; url: string | null };

const STAGE_TABS = [
  { key: "todos", label: "Todos" },
  { key: "edicao", label: "Finalizados" },
  { key: "gravacao", label: "Captações" },
  { key: "roteiro", label: "Roteiros" },
];

export default function AprovacoesPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("edicao");
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<QueueItem | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      supabase.from("calendar_posts").select("*, clients(name)").order("scheduled_date", { ascending: true }),
      supabase.from("team_members").select("*").eq("status", "active"),
    ]).then(([p, m]) => {
      setPosts((p.data as any) || []);
      setMembers((m.data as any) || []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const memberName = (id: string | null) => members.find(m => m.id === id)?.name || "Aberto";

  // Monta a fila: toda etapa com status "entregue"
  const fila: QueueItem[] = posts.flatMap(post =>
    applicableStages(post)
      .filter(stage => stageStatus(post, stage) === "entregue")
      .map(stage => {
        const urlField = stage.key === "roteiro" ? "roteiro_url"
          : stage.key === "gravacao" ? "gravacao_url"
          : stage.key === "edicao" ? "edicao_url" : "post_link";
        return { post, stage, url: (post as any)[urlField] as string | null };
      })
  );

  const filtrada = fila.filter(i => {
    if (tab !== "todos" && i.stage.key !== tab) return false;
    if (busca && !i.post.title?.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const patch = async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("calendar_posts").update(updates).eq("id", id)
      .select("*, clients(name)").single();
    if (error) { toast.error("Erro: " + error.message); return null; }
    setPosts(prev => prev.map(p => p.id === id ? (data as any) : p));
    return data as any as CalendarPost;
  };

  const aprovar = async (item: QueueItem) => {
    setSaving(true);
    const f = STAGE_FIELDS[item.stage.key];
    const stages = applicableStages(item.post);
    const idx = stages.findIndex(s => s.key === item.stage.key);
    const next = stages[idx + 1];
    const updates: any = {
      [f.status]: "aprovado",
      [f.approvedAt]: new Date().toISOString(),
      current_stage: next ? next.key : "concluido",
      feedback: null,
    };
    if (item.stage.key === "publicacao") {
      updates.status = "publicado";
      updates.published_at = new Date().toISOString();
    }
    await patch(item.post.id, updates);
    setSaving(false);
    setSel(null);
    toast.success(next ? `Aprovado — seguiu para ${next.label}` : "Conteúdo concluído 🎉");
  };

  const pedirAlteracao = async (item: QueueItem) => {
    if (!feedback.trim()) { toast.error("Descreva o que precisa mudar"); return; }
    setSaving(true);
    const f = STAGE_FIELDS[item.stage.key];
    await patch(item.post.id, {
      [f.status]: "ajustes",
      feedback: feedback.trim(),
      feedback_at: new Date().toISOString(),
    });
    setSaving(false);
    setShowFeedback(false);
    setFeedback("");
    setSel(null);
    toast.success(`Alteração solicitada para ${item.stage.label}`);
  };

  const previewUrl = toPreviewUrl(sel?.url || null);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== FILA (cards empilhados) ===== */}
      <div className="w-[380px] border-r border-border flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Aprovações</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Entregas da equipe aguardando seu aval</p>
            </div>
            {fila.length > 0 && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/15 text-amber-400">
                {fila.length} pendente{fila.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar conteúdo..."
              className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
          </div>

          <div className="flex gap-1 flex-wrap">
            {STAGE_TABS.map(t => {
              const n = fila.filter(i => t.key === "todos" || i.stage.key === t.key).length;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    tab === t.key ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  {t.label}{n > 0 && ` (${n})`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtrada.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Inbox className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nada aguardando aprovação</p>
              <p className="text-xs text-muted-foreground text-center px-6">
                Quando a equipe marcar um link como pronto no calendário, ele aparece aqui.
              </p>
            </div>
          ) : filtrada.map(item => {
            const fmt = findTag(FORMATOS, item.post.type);
            const part = findTag(PARTICIPANTES, item.post.participante);
            const ativo = sel?.post.id === item.post.id && sel?.stage.key === item.stage.key;
            return (
              <button
                key={`${item.post.id}:${item.stage.key}`}
                onClick={() => { setSel(item); setShowFeedback(false); setFeedback(""); }}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition-all",
                  ativo ? "border-nexus-500 bg-nexus-600/10" : "border-border bg-card hover:border-nexus-500/40"
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: item.stage.color + "26", color: item.stage.color }}>
                    {item.stage.label}
                  </span>
                  {fmt && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: fmt.color + "26", color: fmt.color }}>{fmt.label}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2 mb-1.5">
                  {item.post.title || "sem título"}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    {memberName(item.post.responsavel_id)}
                    {part && ` · ${part.label}`}
                  </span>
                  {item.post.scheduled_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(item.post.scheduled_date), "dd/MM")}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== VISUALIZAÇÃO + AÇÕES ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!sel ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Film className="w-12 h-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Selecione uma entrega para revisar</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho */}
            <div className="px-6 py-4 border-b border-border flex items-start justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground truncate">{sel.post.title || "sem título"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sel.post.clients?.name || "—"} · Etapa{" "}
                  <span style={{ color: sel.stage.color }}>{sel.stage.label}</span>
                  {" "}· entregue por {memberName(sel.post.responsavel_id)}
                </p>
              </div>
              <button onClick={() => setSel(null)} className="p-1 rounded hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="rounded-xl border border-border bg-black/40 overflow-hidden">
                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full"
                    style={{ height: 460 }}
                    allow="autoplay"
                    title="Prévia do conteúdo"
                  />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center gap-3">
                    <FileType2 className="w-10 h-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Sem prévia disponível para este link</p>
                    {sel.url && (
                      <a href={sel.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-nexus-400 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" /> Abrir em nova aba
                      </a>
                    )}
                  </div>
                )}
              </div>

              {sel.url && (
                <a href={sel.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-nexus-400 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir original em nova aba
                </a>
              )}

              {/* Contexto do conteúdo */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Formato", value: findTag(FORMATOS, sel.post.type)?.label || "—" },
                  { label: "Participante", value: findTag(PARTICIPANTES, sel.post.participante)?.label || "—" },
                  { label: "Captação", value: sel.post.captacao_date ? format(parseISO(sel.post.captacao_date), "dd/MM/yy") : "—" },
                  { label: "Postagem", value: sel.post.scheduled_date ? format(parseISO(sel.post.scheduled_date), "dd/MM/yy") : "—" },
                ].map(d => (
                  <div key={d.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{d.label}</p>
                    <p className="text-sm text-foreground mt-0.5">{d.value}</p>
                  </div>
                ))}
              </div>

              {/* Etapas anteriores para conferência */}
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2.5">Material das etapas</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Roteiro", url: sel.post.roteiro_url },
                    { label: "Captação", url: sel.post.gravacao_url },
                    { label: "Finalizado", url: sel.post.edicao_url },
                  ].map(l => (
                    <div key={l.label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{l.label}</span>
                      {l.url ? (
                        <a href={l.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-nexus-400 hover:underline truncate max-w-[280px]">{l.url}</a>
                      ) : <span className="text-xs text-muted-foreground/50">—</span>}
                    </div>
                  ))}
                </div>
              </div>

              {sel.post.feedback && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Última solicitação de alteração</p>
                  <p className="text-xs text-foreground">{sel.post.feedback}</p>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="px-6 py-4 border-t border-border">
              {showFeedback ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                    placeholder="O que precisa ser alterado? Ex: cortar os 2s iniciais, trocar a trilha..."
                    className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowFeedback(false); setFeedback(""); }}
                      className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">
                      Cancelar
                    </button>
                    <button onClick={() => pedirAlteracao(sel)} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar alteração
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setShowFeedback(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm font-medium transition-colors">
                    <RotateCcw className="w-4 h-4" /> Indicar alteração
                  </button>
                  <button onClick={() => aprovar(sel)} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />} Aprovar
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
