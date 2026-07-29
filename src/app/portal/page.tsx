"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarPost } from "@/lib/supabase";
import {
  FORMATOS, findTag, applicableStages, stageStatus, analyzeLink, aspectFor,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import {
  Loader2, LogIn, AlertCircle, CheckCircle2, Clock, ThumbsUp, MessageSquare,
  ExternalLink, FolderOpen, FileType2, X, Send, ListChecks, Inbox, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const CODE_KEY = "nexus.portal-code";

type Cliente = { id: string; name: string };

/**
 * Grupos de projetos por portal: quem entra com o código de um cliente
 * enxerga apenas os projetos listados no grupo dele.
 */
const GRUPOS_PORTAL: Record<string, string[]> = {
  "Instituto Mussi": ["Instituto Mussi", "Dr. Mussi"],
  "Dr. Mussi": ["Instituto Mussi", "Dr. Mussi"],
  "Dr. Ricardo": ["Dr. Ricardo"],
};

/** Um conteúdo está pronto para o cliente ver quando a edição foi finalizada */
function prontoParaCliente(p: CalendarPost): boolean {
  return (
    p.edicao_status === "entregue" || p.edicao_status === "aprovado" ||
    p.publicacao_status === "entregue" || p.publicacao_status === "aprovado" ||
    !!p.edicao_url || !!p.post_link
  );
}

export default function PortalPage() {
  const [code, setCode] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [projetos, setProjetos] = useState<Cliente[]>([]);
  const [projeto, setProjeto] = useState<string>("todos");
  const [posts, setPosts] = useState<CalendarPost[]>([]); // de todos os projetos
  const [checando, setChecando] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState<"aprovacoes" | "andamento">("aprovacoes");
  const [sel, setSel] = useState<CalendarPost | null>(null);
  const [comentando, setComentando] = useState(false);
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  const validar = async (codigo: string) => {
    const { data } = await supabase
      .from("clients").select("id, name").eq("portal_code", codigo.trim()).maybeSingle();
    return (data as Cliente) || null;
  };

  // Carrega apenas os projetos do grupo do cliente que entrou
  const carregarTudo = async (dono: Cliente) => {
    const nomes = GRUPOS_PORTAL[dono.name] || [dono.name];
    const { data: cls } = await supabase
      .from("clients").select("id, name").eq("status", "active")
      .in("name", nomes).order("name");
    const projs = (cls as any as Cliente[]) || [];
    const ids = projs.map(c => c.id);
    const { data: ps } = ids.length
      ? await supabase.from("calendar_posts").select("*").in("client_id", ids).order("scheduled_date", { ascending: true })
      : { data: [] };
    setProjetos(projs);
    setPosts((ps as any) || []);
  };

  useEffect(() => {
    const salvo = typeof window !== "undefined" ? localStorage.getItem(CODE_KEY) : null;
    if (!salvo) { setChecando(false); return; }
    validar(salvo).then(async c => {
      if (c) { setCliente(c); await carregarTudo(c); }
      else localStorage.removeItem(CODE_KEY);
      setChecando(false);
    });
  }, []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(""); setEntrando(true);
    const c = await validar(code);
    if (!c) { setEntrando(false); setErro("Código inválido. Confira com sua agência."); return; }
    localStorage.setItem(CODE_KEY, code.trim());
    setCliente(c);
    await carregarTudo(c);
    setEntrando(false);
  };

  const sair = () => {
    localStorage.removeItem(CODE_KEY);
    setCliente(null); setPosts([]); setProjetos([]); setProjeto("todos"); setCode(""); setSel(null);
  };

  const patch = async (id: string, updates: any, msg: string) => {
    setSaving(true);
    const { data, error } = await supabase
      .from("calendar_posts").update(updates).eq("id", id).select("*").single();
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setPosts(prev => prev.map(p => p.id === id ? (data as any) : p));
    setSel(null); setComentando(false); setComentario("");
    toast.success(msg);
  };

  const aprovar = (p: CalendarPost) =>
    patch(p.id, { cliente_aprovacao: "aprovado", cliente_feedback: null }, "Conteúdo aprovado! Obrigado 🎉");

  const comentar = (p: CalendarPost) => {
    if (!comentario.trim()) { toast.error("Escreva seu comentário"); return; }
    patch(p.id, {
      cliente_aprovacao: "ajustes",
      cliente_feedback: comentario.trim(),
      cliente_feedback_at: new Date().toISOString(),
    }, "Comentário enviado para a equipe");
  };

  // ---- Loading inicial ----
  if (checando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ---- Tela de código ----
  if (!cliente) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex flex-1 relative items-center justify-center p-12"
          style={{ backgroundImage: "url(/brand/degrade-hero.png)", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0 bg-background/55" />
          <div className="relative z-10 max-w-md">
            <img src="/brand/logo-yphe.svg" alt="YPHE" className="h-9 w-auto brightness-0 invert mb-8" />
            <h2 className="text-3xl font-bold text-white leading-tight">Portal do cliente</h2>
            <p className="text-white/70 mt-4 text-sm leading-relaxed">
              Acompanhe a produção do seu conteúdo e aprove os materiais em um só lugar.
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8">
              <img src="/brand/logo-yphe.svg" alt="YPHE" className="h-7 w-auto brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Acessar meu portal</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-8">Digite o código que a agência enviou.</p>
            <form onSubmit={entrar} className="space-y-4">
              <input
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="0000" inputMode="numeric" autoFocus
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-center text-2xl tracking-[0.4em] font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-nexus-500"
              />
              {erro && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{erro}</p>
                </div>
              )}
              <button type="submit" disabled={entrando || !code}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-nexus-600 hover:bg-nexus-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
                {entrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---- Dados do portal (filtrados pelo projeto selecionado) ----
  const doProjeto = projeto === "todos" ? posts : posts.filter(p => p.client_id === projeto);
  const paraAprovar = doProjeto.filter(p => prontoParaCliente(p) && p.cliente_aprovacao !== "aprovado");
  const aprovadosCliente = doProjeto.filter(p => p.cliente_aprovacao === "aprovado").length;
  const nomeProjeto = (id: string | null) => projetos.find(x => x.id === id)?.name || "";

  // andamento agrupado por mês
  const grupos = (() => {
    const map = new Map<string, CalendarPost[]>();
    doProjeto.forEach(p => {
      const k = p.scheduled_date ? p.scheduled_date.slice(0, 7) : "sem-data";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    });
    return [...map.keys()].sort().map(k => ({
      key: k,
      label: k === "sem-data" ? "Sem data" : format(parseISO(`${k}-01`), "MMMM 'de' yyyy", { locale: ptBR }),
      rows: map.get(k)!,
    }));
  })();

  const link = sel ? analyzeLink(sel.edicao_url || sel.post_link) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Topo */}
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand/logo-yphe.svg" alt="YPHE" className="h-5 w-auto brightness-0 invert opacity-90" />
            <span className="text-border">·</span>
            <span className="text-sm font-medium text-foreground">{cliente.name}</span>
          </div>
          <button onClick={sair} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Abas por projeto */}
        {projetos.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap border-b border-border pb-3">
            <button onClick={() => setProjeto("todos")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                projeto === "todos" ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
              Todos os projetos
            </button>
            {projetos.map(pr => {
              const qtd = posts.filter(p => p.client_id === pr.id).length;
              return (
                <button key={pr.id} onClick={() => setProjeto(pr.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    projeto === pr.id ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  {pr.name}
                  {qtd > 0 && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", projeto === pr.id ? "bg-white/20" : "bg-accent")}>{qtd}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Conteúdos no plano", value: doProjeto.length, color: "text-foreground" },
            { label: "Aguardando sua aprovação", value: paraAprovar.length, color: "text-amber-400" },
            { label: "Aprovados por você", value: aprovadosCliente, color: "text-emerald-400" },
          ].map(k => (
            <div key={k.label} className="brand-header px-5 py-4">
              <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-1 border border-border rounded-lg p-0.5 w-fit">
          <button onClick={() => setAba("aprovacoes")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              aba === "aprovacoes" ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground")}>
            <ThumbsUp className="w-3.5 h-3.5" /> Para aprovar{paraAprovar.length ? ` (${paraAprovar.length})` : ""}
          </button>
          <button onClick={() => setAba("andamento")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              aba === "andamento" ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground")}>
            <ListChecks className="w-3.5 h-3.5" /> Andamento
          </button>
        </div>

        {/* ---- APROVAÇÕES ---- */}
        {aba === "aprovacoes" && (
          <div className="grid grid-cols-2 gap-4">
            {paraAprovar.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center gap-3 py-16 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-sm text-foreground font-medium">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground">Nenhum conteúdo aguardando sua aprovação agora.</p>
              </div>
            ) : paraAprovar.map(p => {
              const fmt = findTag(FORMATOS, p.type);
              const info = analyzeLink(p.edicao_url || p.post_link);
              return (
                <button key={p.id} onClick={() => { setSel(p); setComentando(false); setComentario(""); }}
                  className="text-left rounded-xl border border-border bg-card hover:border-nexus-500/40 transition-all overflow-hidden">
                  <div className="aspect-video bg-black/40 flex items-center justify-center relative">
                    {info.thumbUrl ? (
                      <img src={info.thumbUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileType2 className="w-8 h-8 text-muted-foreground/40" />
                    )}
                    {fmt && (
                      <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: fmt.color + "cc", color: "#fff" }}>{fmt.label}</span>
                    )}
                    {p.cliente_aprovacao === "ajustes" && (
                      <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-500 text-white">
                        alteração pedida
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    {projeto === "todos" && (
                      <p className="text-[10px] text-nexus-300 mb-0.5">{nomeProjeto(p.client_id)}</p>
                    )}
                    <p className="text-sm font-medium text-foreground line-clamp-2">{p.title || "sem título"}</p>
                    {p.scheduled_date && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(parseISO(p.scheduled_date), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ---- ANDAMENTO ---- */}
        {aba === "andamento" && (
          <div className="space-y-6">
            {grupos.map(g => (
              <div key={g.key}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 capitalize">{g.label}</p>
                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                  {g.rows.map(p => {
                    const fmt = findTag(FORMATOS, p.type);
                    const stages = applicableStages(p);
                    const concluido = p.cliente_aprovacao === "aprovado";
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                        {p.scheduled_date && (
                          <span className="text-xs text-muted-foreground w-12 flex-shrink-0">
                            {format(parseISO(p.scheduled_date), "dd/MM")}
                          </span>
                        )}
                        {fmt && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium w-24 justify-center"
                            style={{ background: fmt.color + "22", color: fmt.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: fmt.color }} />
                            {fmt.label}
                          </span>
                        )}
                        <p className="text-sm text-foreground flex-1 min-w-0 truncate">{p.title || "—"}</p>
                        {/* progresso das etapas */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {stages.map(s => {
                            const st = stageStatus(p, s);
                            return (
                              <span key={s.key} title={s.label}
                                className="w-6 h-1 rounded-full"
                                style={{ background: st === "aprovado" ? "#34d399" : st === "entregue" ? "#f59e0b" : "#ffffff1a" }} />
                            );
                          })}
                        </div>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 w-24 text-center",
                          concluido ? "bg-emerald-400/10 text-emerald-400"
                            : p.cliente_aprovacao === "ajustes" ? "bg-amber-400/10 text-amber-400"
                            : p.edicao_status === "aprovado" ? "bg-nexus-400/10 text-nexus-300"
                            : "bg-gray-400/10 text-gray-400")}>
                          {concluido ? "aprovado" : p.cliente_aprovacao === "ajustes" ? "em ajuste"
                            : p.edicao_status === "aprovado" ? "p/ aprovar" : "em produção"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ---- Modal de revisão ---- */}
      {sel && link && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSel(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-border sticky top-0 bg-card">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">{sel.title || "sem título"}</h2>
                {sel.scheduled_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Publicação: {format(parseISO(sel.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                )}
              </div>
              <button onClick={() => setSel(null)} className="p-1 rounded hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* preview */}
              {link.previewUrl ? (
                <div className="flex justify-center">
                  <div className="rounded-xl border border-border bg-black overflow-hidden w-full"
                    style={{ aspectRatio: aspectFor(sel.type), maxWidth: sel.type === "reel" || sel.type === "story" ? 340 : 640 }}>
                    <iframe src={link.previewUrl} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen title="Prévia" />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-accent/20 p-6 flex flex-col items-center gap-2 text-center">
                  {link.kind === "pasta" ? <FolderOpen className="w-8 h-8 text-nexus-400" /> : <FileType2 className="w-8 h-8 text-muted-foreground/50" />}
                  <p className="text-sm text-foreground">Prévia não disponível aqui</p>
                  {link.openUrl && (
                    <a href={link.openUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-nexus-400 hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> Ver o material
                    </a>
                  )}
                </div>
              )}

              {sel.caption && (
                <div className="rounded-lg bg-accent/30 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Legenda / briefing</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{sel.caption}</p>
                </div>
              )}

              {sel.cliente_feedback && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Seu comentário anterior</p>
                  <p className="text-sm text-foreground">{sel.cliente_feedback}</p>
                </div>
              )}
            </div>

            {/* ações */}
            <div className="p-5 border-t border-border sticky bottom-0 bg-card">
              {comentando ? (
                <div className="space-y-2">
                  <textarea autoFocus value={comentario} onChange={e => setComentario(e.target.value)} rows={3}
                    placeholder="O que você gostaria de ajustar?"
                    className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setComentando(false)} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
                    <button onClick={() => comentar(sel)} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar comentário
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setComentando(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm font-medium transition-colors">
                    <MessageSquare className="w-4 h-4" /> Pedir ajuste
                  </button>
                  <button onClick={() => aprovar(sel)} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />} Aprovar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
