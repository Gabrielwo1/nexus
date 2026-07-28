"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarPost, TeamMember } from "@/lib/supabase";
import { FORMATOS, findTag } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import {
  Video, Loader2, AlertTriangle, CheckCircle2, CalendarClock,
  Users as UsersIcon, Layers, Camera,
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/** dias de antecedência exigidos para a captação */
const ANTECEDENCIA = 15;
/** quantas idas ao instituto o captador pode fazer por mês */
const IDAS_POR_MES = 3;
/** formatos que exigem gravação */
const FORMATOS_CAPTACAO = ["reel", "story"];
/** janela máxima que uma sessão cobre (mês / idas) */
const JANELA = Math.ceil(30 / IDAS_POR_MES);

type Item = {
  post: CalendarPost;
  postagem: Date | null;
  prazo: Date | null;   // postagem - 15d
  faltam: number | null;
  feito: boolean;
};

type Sessao = {
  data: Date;          // dia sugerido da gravação (prazo mais restritivo do grupo)
  itens: Item[];
  mes: string;         // YYYY-MM da gravação
};

/**
 * Agrupa os conteúdos em sessões de gravação.
 * Ordena pelo prazo e abre uma nova sessão quando o próximo conteúdo
 * está fora da janela — assim cada ida cobre o máximo de material possível
 * sem atrasar quem tem prazo mais curto.
 */
function montarSessoes(itens: Item[]): Sessao[] {
  const comPrazo = itens.filter(i => i.prazo).sort((a, b) => a.prazo!.getTime() - b.prazo!.getTime());
  const sessoes: Sessao[] = [];

  comPrazo.forEach(item => {
    const atual = sessoes[sessoes.length - 1];
    // cabe na sessão aberta se o prazo dela ainda atende este item
    if (atual && differenceInCalendarDays(item.prazo!, atual.data) <= JANELA) {
      atual.itens.push(item);
    } else {
      sessoes.push({
        data: item.prazo!,
        itens: [item],
        mes: format(item.prazo!, "yyyy-MM"),
      });
    }
  });

  return sessoes;
}

export default function CaptacaoPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [membroId, setMembroId] = useState("");
  const [projeto, setProjeto] = useState("todos");
  const [incluirFeitos, setIncluirFeitos] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("calendar_posts").select("*, clients(name)").order("scheduled_date", { ascending: true }),
      supabase.from("team_members").select("*").eq("status", "active").order("name"),
      supabase.from("clients").select("id, name").eq("status", "active").order("name"),
    ]).then(([p, m, c]) => {
      setPosts((p.data as any) || []);
      const mem = (m.data as any as TeamMember[]) || [];
      setMembers(mem);
      setClientes((c.data as any) || []);
      const guto = mem.find(x => x.name === "Guto") || mem.find(x => x.role === "videomaker");
      setMembroId(guto?.id || mem[0]?.id || "");
      setLoading(false);
    });
  }, []);

  const membro = members.find(m => m.id === membroId);
  const hoje = new Date();

  const itens: Item[] = posts
    .filter(p => FORMATOS_CAPTACAO.includes(p.type))
    .filter(p => !membro || p.gravacao_by === membro.id)
    .filter(p => projeto === "todos" || p.client_id === projeto)
    .filter(p => incluirFeitos || (p.gravacao_status !== "aprovado" && p.gravacao_status !== "entregue"))
    .map(p => {
      const postagem = p.scheduled_date ? parseISO(p.scheduled_date) : null;
      const prazo = postagem ? addDays(postagem, -ANTECEDENCIA) : null;
      return {
        post: p,
        postagem,
        prazo,
        faltam: prazo ? differenceInCalendarDays(prazo, hoje) : null,
        feito: p.gravacao_status === "aprovado" || p.gravacao_status === "entregue",
      };
    });

  const sessoes = montarSessoes(itens);
  const semData = itens.filter(i => !i.prazo);

  // agrupa sessões por mês para checar o limite de idas
  const meses = (() => {
    const map = new Map<string, Sessao[]>();
    sessoes.forEach(s => {
      if (!map.has(s.mes)) map.set(s.mes, []);
      map.get(s.mes)!.push(s);
    });
    return [...map.keys()].sort().map(k => ({
      key: k,
      label: format(parseISO(`${k}-01`), "MMMM 'de' yyyy", { locale: ptBR }),
      sessoes: map.get(k)!,
      excedeu: map.get(k)!.length > IDAS_POR_MES,
    }));
  })();

  // KPIs
  const pendentes = itens.filter(i => !i.feito);
  const atrasados = pendentes.filter(i => i.faltam !== null && i.faltam < 0);
  const feitos = itens.filter(i => i.feito).length;
  const mediaPorIda = sessoes.length ? Math.round(itens.filter(i => i.prazo).length / sessoes.length) : 0;

  const statusPrazo = (i: Item) => {
    if (i.feito) return { txt: "Captado", cls: "bg-emerald-400/10 text-emerald-400" };
    if (i.faltam === null) return { txt: "sem data", cls: "bg-gray-400/10 text-gray-400" };
    if (i.faltam < 0) return { txt: `${Math.abs(i.faltam)}d atrasado`, cls: "bg-red-500/10 text-red-400" };
    if (i.faltam === 0) return { txt: "vence hoje", cls: "bg-red-500/10 text-red-400" };
    if (i.faltam <= 3) return { txt: `faltam ${i.faltam}d`, cls: "bg-amber-400/10 text-amber-400" };
    return { txt: `faltam ${i.faltam}d`, cls: "bg-nexus-400/10 text-nexus-300" };
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="brand-header flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-nexus-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Matriz de Captação</h1>
            <p className="text-sm text-muted-foreground">
              Gravação até {ANTECEDENCIA} dias antes da postagem · máximo de {IDAS_POR_MES} idas por mês
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={membroId} onChange={e => setMembroId(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={projeto} onChange={e => setProjeto(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
          <option value="todos">Todos os projetos</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer ml-1">
          <input type="checkbox" checked={incluirFeitos} onChange={e => setIncluirFeitos(e.target.checked)}
            className="w-4 h-4 rounded accent-nexus-500" />
          Mostrar já captados
        </label>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "A captar", value: pendentes.length, icon: Camera, cor: "text-foreground", bg: "bg-accent/40" },
              { label: "Atrasados", value: atrasados.length, icon: AlertTriangle, cor: "text-red-400", bg: "bg-red-500/10" },
              { label: "Idas necessárias", value: sessoes.length, icon: Layers, cor: "text-nexus-400", bg: "bg-nexus-400/10" },
              { label: "Média por ida", value: mediaPorIda, icon: UsersIcon, cor: "text-amber-400", bg: "bg-amber-400/10" },
            ].map(k => (
              <div key={k.label} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</p>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", k.bg)}>
                    <k.icon className={cn("w-4 h-4", k.cor)} />
                  </div>
                </div>
                <p className={cn("text-xl font-bold", k.cor)}>{k.value}</p>
              </div>
            ))}
          </div>

          {atrasados.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">
                {membro?.name} tem <span className="font-semibold">{atrasados.length}</span> conteúdo{atrasados.length > 1 ? "s" : ""} com prazo de captação estourado.
              </p>
            </div>
          )}

          {/* Sessões agrupadas por mês */}
          {meses.length === 0 ? (
            <div className="glass rounded-xl py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Nenhuma captação pendente</p>
              <p className="text-xs text-muted-foreground mt-1">{membro?.name} está em dia com as gravações.</p>
            </div>
          ) : meses.map(mes => (
            <div key={mes.key} className="space-y-3">
              {/* Cabeçalho do mês */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider capitalize">{mes.label}</p>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium",
                    mes.excedeu ? "bg-red-500/10 text-red-400" : "bg-emerald-400/10 text-emerald-400")}>
                    {mes.sessoes.length} de {IDAS_POR_MES} idas
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                    {mes.sessoes.reduce((a, s) => a + s.itens.length, 0)} conteúdos
                  </span>
                </div>
              </div>

              {mes.excedeu && (
                <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    Este mês precisaria de <span className="font-semibold">{mes.sessoes.length} idas</span>, acima do limite de {IDAS_POR_MES}.
                    Antecipe conteúdos para a gravação anterior ou negocie uma ida extra.
                  </p>
                </div>
              )}

              {/* Cada sessão de gravação */}
              {mes.sessoes.map((s, idx) => {
                const porFormato = FORMATOS_CAPTACAO
                  .map(f => ({ opt: findTag(FORMATOS, f), qtd: s.itens.filter(i => i.post.type === f).length }))
                  .filter(x => x.opt && x.qtd > 0);
                const excedente = idx >= IDAS_POR_MES;
                const diasAte = differenceInCalendarDays(s.data, hoje);
                return (
                  <div key={idx} className={cn("rounded-xl border overflow-hidden",
                    excedente ? "border-amber-500/30" : "border-border")}>
                    {/* Cabeçalho da sessão */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-accent/20 border-b border-border flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-nexus-600/15 flex items-center justify-center">
                          <Camera className="w-4 h-4 text-nexus-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Ida {idx + 1} · {format(s.data, "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {s.itens.length} conteúdos na mesma gravação
                            {diasAte >= 0 ? ` · em ${diasAte}d` : ` · ${Math.abs(diasAte)}d atrasada`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {porFormato.map(({ opt, qtd }) => (
                          <span key={opt!.value}
                            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border"
                            style={{ borderColor: opt!.color + "40", background: opt!.color + "14", color: opt!.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt!.color }} />
                            {opt!.label}<span className="font-bold">{qtd}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Conteúdos da sessão */}
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/60">
                          {["Projeto", "Formato", "Headline", "Postagem", "Prazo"].map(h => (
                            <th key={h} className="px-4 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {s.itens.map(i => {
                          const fmt = findTag(FORMATOS, i.post.type);
                          const sp = statusPrazo(i);
                          return (
                            <tr key={i.post.id} className="hover:bg-accent/10 transition-colors">
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{i.post.clients?.name || "—"}</td>
                              <td className="px-4 py-2.5">
                                {fmt && (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full"
                                    style={{ background: fmt.color + "26", color: fmt.color }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: fmt.color }} />{fmt.label}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-sm text-foreground max-w-[340px]"><p className="truncate">{i.post.title || "—"}</p></td>
                              <td className="px-4 py-2.5 text-xs text-foreground">{i.postagem ? format(i.postagem, "dd/MM/yyyy") : "—"}</td>
                              <td className="px-4 py-2.5">
                                <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", sp.cls)}>{sp.txt}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Sem data de postagem */}
          {semData.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Sem data de postagem ({semData.length})
              </p>
              <div className="glass rounded-xl p-4 flex flex-wrap gap-2">
                {semData.map(i => (
                  <span key={i.post.id} className="text-xs bg-accent px-2.5 py-1 rounded-lg text-muted-foreground">
                    {i.post.title || "sem título"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
