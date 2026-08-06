"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarPost, TeamMember } from "@/lib/supabase";
import { FORMATOS, findTag, analyzeLink } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import {
  Video, Loader2, AlertTriangle, CheckCircle2, Layers, Camera,
  Users as UsersIcon, CalendarClock, FileText,
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/** dias de antecedência exigidos para a captação */
const ANTECEDENCIA = 15;
/** idas ao instituto que o Guto pode fazer por mês */
const IDAS_POR_MES = 3;
/** só reels exigem captação */
const FORMATOS_CAPTACAO = ["reel"];
/** janela que uma ida cobre (mês / idas) */
const JANELA = Math.ceil(30 / IDAS_POR_MES);

/** quem opera com o limite de idas agrupadas */
const CAPTADOR_AGRUPADO = "Guto";

type Item = {
  post: CalendarPost;
  postagem: Date | null;
  prazo: Date | null;
  faltam: number | null;
  feito: boolean;
};

type Sessao = { data: Date; itens: Item[]; mes: string };

/** Agrupa os reels em idas, usando sempre o prazo mais curto do grupo */
function montarSessoes(itens: Item[]): Sessao[] {
  const comPrazo = itens.filter(i => i.prazo).sort((a, b) => a.prazo!.getTime() - b.prazo!.getTime());
  const sessoes: Sessao[] = [];
  comPrazo.forEach(item => {
    const atual = sessoes[sessoes.length - 1];
    if (atual && differenceInCalendarDays(item.prazo!, atual.data) <= JANELA) {
      atual.itens.push(item);
    } else {
      sessoes.push({ data: item.prazo!, itens: [item], mes: format(item.prazo!, "yyyy-MM") });
    }
  });
  return sessoes;
}

export default function CaptacaoPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [captadorId, setCaptadorId] = useState("");
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
      const guto = mem.find(x => x.name === CAPTADOR_AGRUPADO) || mem.find(x => x.role === "videomaker");
      setCaptadorId(guto?.id || mem[0]?.id || "");
      setLoading(false);
    });
  }, []);

  // captadores = quem aparece como responsável de gravação + Guto/Augusto
  const captadores = members.filter(m =>
    ["Guto", "Algusto", "Augusto"].includes(m.name) ||
    m.role === "videomaker" || m.role === "stories"
  );

  const captador = members.find(m => m.id === captadorId);
  const agrupado = captador?.name === CAPTADOR_AGRUPADO;
  const hoje = new Date();

  const itens: Item[] = posts
    .filter(p => FORMATOS_CAPTACAO.includes(p.type))
    .filter(p => !captador || p.gravacao_by === captador.id)
    .filter(p => projeto === "todos" || p.client_id === projeto)
    .filter(p => incluirFeitos || (p.gravacao_status !== "aprovado" && p.gravacao_status !== "entregue"))
    .map(p => {
      const postagem = p.scheduled_date ? parseISO(p.scheduled_date) : null;
      const prazo = postagem ? addDays(postagem, -ANTECEDENCIA) : null;
      return {
        post: p, postagem, prazo,
        faltam: prazo ? differenceInCalendarDays(prazo, hoje) : null,
        feito: p.gravacao_status === "aprovado" || p.gravacao_status === "entregue",
      };
    });

  const sessoes = agrupado ? montarSessoes(itens) : [];
  const semData = itens.filter(i => !i.prazo);
  const pendentes = itens.filter(i => !i.feito);
  const atrasados = pendentes.filter(i => i.faltam !== null && i.faltam < 0);
  const feitos = itens.filter(i => i.feito).length;
  const mediaPorIda = sessoes.length ? Math.round(itens.filter(i => i.prazo).length / sessoes.length) : 0;

  // meses (agrupado = idas | simples = lista por mês de prazo)
  const mesesIdas = (() => {
    const map = new Map<string, Sessao[]>();
    sessoes.forEach(s => { if (!map.has(s.mes)) map.set(s.mes, []); map.get(s.mes)!.push(s); });
    return [...map.keys()].sort().map(k => ({
      key: k,
      label: format(parseISO(`${k}-01`), "MMMM 'de' yyyy", { locale: ptBR }),
      sessoes: map.get(k)!,
      excedeu: map.get(k)!.length > IDAS_POR_MES,
    }));
  })();

  const mesesLista = (() => {
    const map = new Map<string, Item[]>();
    itens.filter(i => i.prazo).sort((a, b) => a.prazo!.getTime() - b.prazo!.getTime())
      .forEach(i => {
        const k = format(i.prazo!, "yyyy-MM");
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(i);
      });
    return [...map.keys()].sort().map(k => ({
      key: k,
      label: format(parseISO(`${k}-01`), "MMMM 'de' yyyy", { locale: ptBR }),
      linhas: map.get(k)!,
    }));
  })();

  const statusPrazo = (i: Item) => {
    if (i.feito) return { txt: "Captado", cls: "bg-emerald-400/10 text-emerald-400" };
    if (i.faltam === null) return { txt: "sem data", cls: "bg-gray-400/10 text-gray-400" };
    if (i.faltam < 0) return { txt: `${Math.abs(i.faltam)}d atrasado`, cls: "bg-red-500/10 text-red-400" };
    if (i.faltam === 0) return { txt: "vence hoje", cls: "bg-red-500/10 text-red-400" };
    if (i.faltam <= 3) return { txt: `faltam ${i.faltam}d`, cls: "bg-amber-400/10 text-amber-400" };
    return { txt: `faltam ${i.faltam}d`, cls: "bg-nexus-400/10 text-nexus-300" };
  };

  const celulaRoteiro = (i: Item) => {
    const info = analyzeLink(i.post.roteiro_url);
    if (info.kind === "vazio") {
      return <span className="text-xs text-muted-foreground/40">sem roteiro</span>;
    }
    return (
      <a href={info.openUrl!} target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border text-[11px] text-nexus-400 hover:text-nexus-300 hover:bg-accent transition-colors whitespace-nowrap">
        <FileText className="w-3 h-3" /> Abrir roteiro
      </a>
    );
  };

  const linhaTabela = (i: Item) => {
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
        <td className="px-4 py-2.5 text-xs font-medium text-foreground">{i.prazo ? format(i.prazo, "dd/MM") : "—"}</td>
        <td className="px-4 py-2.5">{celulaRoteiro(i)}</td>
        <td className="px-4 py-2.5">
          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", sp.cls)}>{sp.txt}</span>
        </td>
      </tr>
    );
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
              Reels gravados até {ANTECEDENCIA} dias antes da postagem
              {agrupado && ` · máximo de ${IDAS_POR_MES} idas por mês`}
            </p>
          </div>
        </div>
      </div>

      {/* Abas por captador */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-border pb-3">
        {captadores.map(c => {
          const qtd = posts.filter(p =>
            FORMATOS_CAPTACAO.includes(p.type) && p.gravacao_by === c.id &&
            p.gravacao_status !== "aprovado" && p.gravacao_status !== "entregue"
          ).length;
          const ativo = captadorId === c.id;
          return (
            <button key={c.id} onClick={() => setCaptadorId(c.id)}
              className={cn("flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                ativo ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                ativo ? "bg-white/20" : "bg-neutral-700 text-white")}>{c.name[0]}</span>
              {c.name}
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", ativo ? "bg-white/20" : "bg-accent")}>{qtd}</span>
              {c.name === CAPTADOR_AGRUPADO && (
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full",
                  ativo ? "bg-white/20" : "bg-amber-400/10 text-amber-400")}>{IDAS_POR_MES} idas/mês</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
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
              { label: "Reels a captar", value: pendentes.length, icon: Camera, cor: "text-foreground", bg: "bg-accent/40" },
              { label: "Atrasados", value: atrasados.length, icon: AlertTriangle, cor: "text-red-400", bg: "bg-red-500/10" },
              agrupado
                ? { label: "Idas necessárias", value: sessoes.length, icon: Layers, cor: "text-nexus-400", bg: "bg-nexus-400/10" }
                : { label: "Prazo esta semana", value: pendentes.filter(i => i.faltam !== null && i.faltam >= 0 && i.faltam <= 7).length, icon: CalendarClock, cor: "text-amber-400", bg: "bg-amber-400/10" },
              agrupado
                ? { label: "Média por ida", value: mediaPorIda, icon: UsersIcon, cor: "text-amber-400", bg: "bg-amber-400/10" }
                : { label: "Captados", value: feitos, icon: CheckCircle2, cor: "text-emerald-400", bg: "bg-emerald-400/10" },
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
                {captador?.name} tem <span className="font-semibold">{atrasados.length}</span> reel{atrasados.length > 1 ? "s" : ""} com prazo de captação estourado.
              </p>
            </div>
          )}

          {itens.length === 0 ? (
            <div className="glass rounded-xl py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Nenhuma captação pendente</p>
              <p className="text-xs text-muted-foreground mt-1">{captador?.name} está em dia com as gravações.</p>
            </div>
          ) : agrupado ? (
            /* ===== GUTO — agrupado em idas ===== */
            mesesIdas.map(mes => (
              <div key={mes.key} className="space-y-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider capitalize">{mes.label}</p>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium",
                    mes.excedeu ? "bg-red-500/10 text-red-400" : "bg-emerald-400/10 text-emerald-400")}>
                    {mes.sessoes.length} de {IDAS_POR_MES} idas
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                    {mes.sessoes.reduce((a, s) => a + s.itens.length, 0)} reels
                  </span>
                </div>

                {mes.excedeu && (
                  <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">
                      Este mês precisaria de <span className="font-semibold">{mes.sessoes.length} idas</span>, acima do limite de {IDAS_POR_MES}.
                      Antecipe reels para a gravação anterior ou negocie uma ida extra.
                    </p>
                  </div>
                )}

                {mes.sessoes.map((s, idx) => {
                  const excedente = idx >= IDAS_POR_MES;
                  const diasAte = differenceInCalendarDays(s.data, hoje);
                  return (
                    <div key={idx} className={cn("rounded-xl border overflow-hidden", excedente ? "border-amber-500/30" : "border-border")}>
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
                              {s.itens.length} reels na mesma gravação
                              {diasAte >= 0 ? ` · em ${diasAte}d` : ` · ${Math.abs(diasAte)}d atrasada`}
                            </p>
                          </div>
                        </div>
                        {excedente && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">
                            acima do limite
                          </span>
                        )}
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/60">
                            {["Projeto", "Formato", "Headline", "Postagem", `Gravar até (−${ANTECEDENCIA}d)`, "Roteiro", "Prazo"].map(h => (
                              <th key={h} className="px-4 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">{s.itens.map(linhaTabela)}</tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            /* ===== AUGUSTO — lista simples por prazo ===== */
            mesesLista.map(mes => (
              <div key={mes.key}>
                <div className="flex items-center gap-2.5 mb-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider capitalize">{mes.label}</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                    {mes.linhas.length} reels
                  </span>
                </div>
                <div className="glass rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-accent/20">
                        {["Projeto", "Formato", "Headline", "Postagem", `Gravar até (−${ANTECEDENCIA}d)`, "Roteiro", "Prazo"].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">{mes.linhas.map(linhaTabela)}</tbody>
                  </table>
                </div>
              </div>
            ))
          )}

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
