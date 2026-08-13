"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarPost } from "@/lib/supabase";
import { STAGES, FORMATOS, findTag, applicableStages, type StageDef } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { X, Search, Loader2, Link2, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Arquivo = { key: string; name: string; size: number; updatedAt: string | null };

/** Link permanente — o /api/acervo/ver assina uma URL nova a cada acesso */
export const linkPermanente = (key: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/api/acervo/ver?key=${encodeURIComponent(key)}`;

/**
 * Vincula um arquivo do acervo a um espaço de link de um item do calendário
 * (Roteiro, Gravação, Edição ou Publicação).
 */
export default function VincularModal({ arquivo, onFechar }: { arquivo: Arquivo; onFechar: () => void }) {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [projeto, setProjeto] = useState("todos");
  const [busca, setBusca] = useState("");
  const [post, setPost] = useState<CalendarPost | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("calendar_posts").select("*, clients(name)").order("scheduled_date", { ascending: false }).limit(400),
      supabase.from("clients").select("id, name").eq("status", "active").order("name"),
    ]).then(([p, c]) => {
      setPosts((p.data as any) || []);
      setClientes((c.data as any) || []);
      setLoading(false);
    });
  }, []);

  const lista = useMemo(() => posts
    .filter(p => projeto === "todos" || p.client_id === projeto)
    .filter(p => !busca || (p.title || "").toLowerCase().includes(busca.toLowerCase()))
    .slice(0, 60), [posts, projeto, busca]);

  const vincular = async (stage: StageDef) => {
    if (!post) return;
    const atual = post[stage.urlField] as string | null;
    if (atual && !confirm(`"${stage.label}" já tem um link. Substituir pelo arquivo "${arquivo.name}"?`)) return;

    setSalvando(true);
    const { error } = await supabase
      .from("calendar_posts")
      .update({ [stage.urlField]: linkPermanente(arquivo.key) } as any)
      .eq("id", post.id);
    setSalvando(false);

    if (error) { toast.error("Erro ao vincular: " + error.message); return; }
    toast.success(`Arquivo vinculado em ${stage.label}`);
    onFechar();
  };

  const etapas = post ? applicableStages(post) : [];

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onFechar}>
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* cabeçalho */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4 text-nexus-400" /> Vincular ao calendário
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{arquivo.name}</p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-accent transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {!post ? (
          <>
            {/* filtros */}
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <select value={projeto} onChange={e => setProjeto(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none">
                <option value="todos">Todos os projetos</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar pelo título..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none focus:border-nexus-500/50" />
              </div>
            </div>

            {/* posts */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : !lista.length ? (
                <p className="text-center text-xs text-muted-foreground py-16">Nenhum item encontrado</p>
              ) : (
                <div className="divide-y divide-border">
                  {lista.map(p => {
                    const fmt = findTag(FORMATOS, p.type);
                    return (
                      <button key={p.id} onClick={() => setPost(p)}
                        className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-accent/30 transition-colors text-left group">
                        <span className="text-[11px] text-muted-foreground w-16 flex-shrink-0">
                          {p.scheduled_date ? format(parseISO(p.scheduled_date), "dd/MM/yy") : "—"}
                        </span>
                        {fmt && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: fmt.color + "26", color: fmt.color }}>{fmt.label}</span>
                        )}
                        <span className="text-[13px] text-foreground truncate flex-1">{p.title || "Sem título"}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:block">
                          {(p as any).clients?.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* escolha da etapa */
          <div className="flex-1 overflow-y-auto p-5">
            <button onClick={() => setPost(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground mb-3 transition-colors">
              ← trocar item
            </button>
            <p className="text-sm font-medium text-foreground mb-1">{post.title || "Sem título"}</p>
            <p className="text-xs text-muted-foreground mb-5">
              {post.scheduled_date
                ? format(parseISO(post.scheduled_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                : "sem data de postagem"}
            </p>

            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2.5">
              Em qual espaço de link?
            </p>
            <div className="space-y-2">
              {etapas.map(s => {
                const atual = post[s.urlField] as string | null;
                return (
                  <button key={s.key} onClick={() => vincular(s)} disabled={salvando}
                    className={cn("w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all disabled:opacity-50",
                      "border-border hover:border-nexus-500/50 hover:bg-accent/30")}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: s.color + "26", color: s.color }}>{s.short}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-foreground">{s.label}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {atual ? "já tem link — será substituído" : "vazio"}
                      </span>
                    </span>
                    {atual
                      ? <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      : <CheckCircle2 className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {etapas.length < STAGES.length && (
              <p className="text-[11px] text-muted-foreground mt-4">
                Gravação só aparece em reels e stories.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
