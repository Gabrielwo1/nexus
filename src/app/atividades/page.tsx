"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarPost, TeamMember } from "@/lib/supabase";
import { FORMATOS, findTag } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { ClipboardList, Loader2, AlertTriangle, Clock, CheckCircle2, CalendarClock } from "lucide-react";
import { format, parseISO, differenceInCalendarDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/** dias de antecedência que a entrega deve respeitar */
const ANTECEDENCIA = 4;
/** formatos que contam como atividade de design */
const FORMATOS_DESIGN = ["carrossel", "reel"];

export default function AtividadesPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [membroId, setMembroId] = useState<string>("");
  const [projeto, setProjeto] = useState("todos");
  const [incluirEntregues, setIncluirEntregues] = useState(false);

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
      // começa no Pet (etapa de edição/design)
      const pet = mem.find(x => x.name === "Pet") || mem.find(x => x.role === "social_media");
      setMembroId(pet?.id || mem[0]?.id || "");
      setLoading(false);
    });
  }, []);

  const membro = members.find(m => m.id === membroId);
  const hoje = new Date();

  // Atividades de design (carrossel + reel) atribuídas ao membro na etapa de edição
  const atividades = posts
    .filter(p => FORMATOS_DESIGN.includes(p.type))
    .filter(p => !membro || p.edicao_by === membro.id)
    .filter(p => projeto === "todos" || p.client_id === projeto)
    .filter(p => incluirEntregues || (p.edicao_status !== "aprovado" && p.edicao_status !== "entregue"))
    .map(p => {
      const postagem = p.scheduled_date ? parseISO(p.scheduled_date) : null;
      const prazo = postagem ? addDays(postagem, -ANTECEDENCIA) : null;
      const faltam = prazo ? differenceInCalendarDays(prazo, hoje) : null;
      const feito = p.edicao_status === "aprovado" || p.edicao_status === "entregue";
      return { post: p, postagem, prazo, faltam, feito };
    })
    .sort((a, b) => {
      if (!a.prazo) return 1;
      if (!b.prazo) return -1;
      return a.prazo.getTime() - b.prazo.getTime();
    });

  // KPIs
  const pendentes = atividades.filter(a => !a.feito);
  const atrasadas = pendentes.filter(a => a.faltam !== null && a.faltam < 0);
  const semana = pendentes.filter(a => a.faltam !== null && a.faltam >= 0 && a.faltam <= 7);
  const feitas = atividades.filter(a => a.feito).length;

  // agrupa por mês de postagem
  const grupos = (() => {
    const map = new Map<string, typeof atividades>();
    atividades.forEach(a => {
      const k = a.post.scheduled_date ? a.post.scheduled_date.slice(0, 7) : "sem-data";
      if (!map.has(k)) map.set(k, [] as any);
      (map.get(k) as any).push(a);
    });
    return [...map.keys()].sort().map(k => ({
      key: k,
      label: k === "sem-data" ? "Sem data" : format(parseISO(`${k}-01`), "MMMM 'de' yyyy", { locale: ptBR }),
      linhas: map.get(k)!,
    }));
  })();

  const statusPrazo = (a: typeof atividades[0]) => {
    if (a.feito) return { txt: "Entregue", cls: "bg-emerald-400/10 text-emerald-400" };
    if (a.faltam === null) return { txt: "sem data", cls: "bg-gray-400/10 text-gray-400" };
    if (a.faltam < 0) return { txt: `${Math.abs(a.faltam)}d atrasada`, cls: "bg-red-500/10 text-red-400" };
    if (a.faltam === 0) return { txt: "vence hoje", cls: "bg-red-500/10 text-red-400" };
    if (a.faltam <= 2) return { txt: `faltam ${a.faltam}d`, cls: "bg-amber-400/10 text-amber-400" };
    return { txt: `faltam ${a.faltam}d`, cls: "bg-nexus-400/10 text-nexus-300" };
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="brand-header flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-nexus-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Matriz de Atividades</h1>
            <p className="text-sm text-muted-foreground">
              Design (carrossel e reels) — entrega até {ANTECEDENCIA} dias antes da postagem
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
          <input type="checkbox" checked={incluirEntregues} onChange={e => setIncluirEntregues(e.target.checked)}
            className="w-4 h-4 rounded accent-nexus-500" />
          Mostrar entregues
        </label>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Pendentes", value: pendentes.length, icon: ClipboardList, cor: "text-foreground", bg: "bg-accent/40" },
              { label: "Atrasadas", value: atrasadas.length, icon: AlertTriangle, cor: "text-red-400", bg: "bg-red-500/10" },
              { label: "Prazo esta semana", value: semana.length, icon: CalendarClock, cor: "text-amber-400", bg: "bg-amber-400/10" },
              { label: "Entregues", value: feitas, icon: CheckCircle2, cor: "text-emerald-400", bg: "bg-emerald-400/10" },
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

          {atrasadas.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">
                {membro?.name} tem <span className="font-semibold">{atrasadas.length}</span> atividade{atrasadas.length > 1 ? "s" : ""} com prazo estourado.
              </p>
            </div>
          )}

          {/* Tabela por mês */}
          {grupos.length === 0 ? (
            <div className="glass rounded-xl py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Nenhuma atividade pendente</p>
              <p className="text-xs text-muted-foreground mt-1">{membro?.name} está em dia com os designs.</p>
            </div>
          ) : grupos.map(g => (
            <div key={g.key}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 capitalize">{g.label}</p>
              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-accent/20">
                      {["Projeto", "Formato", "Headline", "Postagem", `Entregar até (−${ANTECEDENCIA}d)`, "Prazo"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {g.linhas.map(a => {
                      const fmt = findTag(FORMATOS, a.post.type);
                      const sp = statusPrazo(a);
                      const urgente = !a.feito && a.faltam !== null && a.faltam <= 2;
                      return (
                        <tr key={a.post.id} className={cn("hover:bg-accent/10 transition-colors", urgente && "bg-red-500/[0.03]")}>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{a.post.clients?.name || "—"}</td>
                          <td className="px-4 py-3">
                            {fmt && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full"
                                style={{ background: fmt.color + "26", color: fmt.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: fmt.color }} />{fmt.label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground max-w-[320px]"><p className="truncate">{a.post.title || "—"}</p></td>
                          <td className="px-4 py-3 text-xs text-foreground">
                            {a.postagem ? format(a.postagem, "dd/MM/yyyy") : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-foreground">
                            {a.prazo ? format(a.prazo, "dd/MM") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", sp.cls)}>{sp.txt}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
