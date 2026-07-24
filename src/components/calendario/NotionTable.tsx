"use client";

import { useState } from "react";
import type { CalendarPost, TeamMember } from "@/lib/supabase";
import {
  FORMATOS, COMUNICACOES, TIPOS_CONTEUDO, PARTICIPANTES, findTag, type TagOpt,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { Plus, Link2, Calendar as CalIcon, ChevronDown, Type, User, Loader2, Check, Copy, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = {
  posts: CalendarPost[];
  members: TeamMember[];
  onUpdate: (id: string, patch: Record<string, any>) => Promise<void>;
  onCreate: () => void;
  onDuplicate: (post: CalendarPost) => void;
  onDelete: (id: string) => void;
  creating?: boolean;
};

const COLS = [
  { key: "captacao_date", label: "Captação", icon: CalIcon, w: 130 },
  { key: "edicao_range", label: "Edição", icon: CalIcon, w: 165 },
  { key: "participante", label: "Participante", icon: ChevronDown, w: 145 },
  { key: "responsavel_id", label: "Responsável", icon: User, w: 130 },
  { key: "scheduled_date", label: "Postagem", icon: CalIcon, w: 130 },
  { key: "type", label: "Formato", icon: ChevronDown, w: 120 },
  { key: "comunicacao", label: "Comunicação", icon: ChevronDown, w: 140 },
  { key: "tipo_conteudo", label: "Tipo", icon: ChevronDown, w: 130 },
  { key: "title", label: "Headline", icon: Type, w: 300 },
  { key: "roteiro_url", label: "Link do Roteiro", icon: Link2, w: 160 },
  { key: "gravacao_url", label: "Link - Capitações", icon: Link2, w: 160 },
  { key: "edicao_url", label: "Link - Finalizados", icon: Link2, w: 160 },
];

// pílula colorida estilo Notion
function Pill({ opt }: { opt: TagOpt }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
      style={{ background: opt.color + "26", color: opt.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: opt.color }} />
      {opt.label}
    </span>
  );
}

function PersonPill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-nexus-500/20 text-nexus-200 whitespace-nowrap">
      <span className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
        {name[0]}
      </span>
      {name}
    </span>
  );
}

const fmtDate = (d: string | null) =>
  d ? format(parseISO(d), "dd MMM yyyy", { locale: ptBR }) : "";

export default function NotionTable({ posts, members, onUpdate, onCreate, onDuplicate, onDelete, creating }: Props) {
  const [editing, setEditing] = useState<string | null>(null); // "id:field"
  const key = (id: string, f: string) => `${id}:${f}`;

  const commit = async (id: string, field: string, value: any) => {
    setEditing(null);
    await onUpdate(id, { [field]: value === "" ? null : value });
  };

  const renderSelect = (p: CalendarPost, field: string, opts: TagOpt[]) => {
    const cur = findTag(opts, (p as any)[field]);
    const isEd = editing === key(p.id, field);
    if (isEd) {
      return (
        <select autoFocus defaultValue={(p as any)[field] || ""}
          onBlur={() => setEditing(null)}
          onChange={e => commit(p.id, field, e.target.value)}
          className="w-full bg-card border border-nexus-500 rounded px-1.5 py-1 text-xs text-foreground focus:outline-none">
          <option value="">—</option>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    return (
      <div onClick={() => setEditing(key(p.id, field))} className="cursor-pointer min-h-[24px] flex items-center">
        {cur ? <Pill opt={cur} /> : <span className="text-muted-foreground/40 text-xs">—</span>}
      </div>
    );
  };

  const renderPerson = (p: CalendarPost) => {
    const isEd = editing === key(p.id, "responsavel_id");
    const m = members.find(x => x.id === p.responsavel_id);
    if (isEd) {
      return (
        <select autoFocus defaultValue={p.responsavel_id || ""}
          onBlur={() => setEditing(null)}
          onChange={e => commit(p.id, "responsavel_id", e.target.value)}
          className="w-full bg-card border border-nexus-500 rounded px-1.5 py-1 text-xs text-foreground focus:outline-none">
          <option value="">Aberto</option>
          {members.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      );
    }
    return (
      <div onClick={() => setEditing(key(p.id, "responsavel_id"))} className="cursor-pointer min-h-[24px] flex items-center">
        {m ? <PersonPill name={m.name} /> : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs whitespace-nowrap bg-orange-400/15 text-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Aberto
          </span>
        )}
      </div>
    );
  };

  const renderDate = (p: CalendarPost, field: string) => {
    const isEd = editing === key(p.id, field);
    const val = (p as any)[field] as string | null;
    if (isEd) {
      return (
        <input type="date" autoFocus defaultValue={val || ""}
          onBlur={e => commit(p.id, field, e.target.value)}
          className="w-full bg-card border border-nexus-500 rounded px-1.5 py-1 text-xs text-foreground focus:outline-none" />
      );
    }
    return (
      <div onClick={() => setEditing(key(p.id, field))} className="cursor-pointer min-h-[24px] flex items-center text-xs text-foreground">
        {val ? fmtDate(val) : <span className="text-muted-foreground/40">—</span>}
      </div>
    );
  };

  const renderRange = (p: CalendarPost) => {
    const isEd = editing === key(p.id, "edicao_range");
    if (isEd) {
      return (
        <div className="flex items-center gap-1" onBlur={() => setTimeout(() => setEditing(null), 150)}>
          <input type="date" defaultValue={p.edicao_start || ""} autoFocus
            onChange={e => onUpdate(p.id, { edicao_start: e.target.value || null })}
            className="w-full bg-card border border-nexus-500 rounded px-1 py-1 text-[10px] text-foreground focus:outline-none" />
          <span className="text-muted-foreground text-[10px]">→</span>
          <input type="date" defaultValue={p.edicao_end || ""}
            onChange={e => onUpdate(p.id, { edicao_end: e.target.value || null })}
            className="w-full bg-card border border-nexus-500 rounded px-1 py-1 text-[10px] text-foreground focus:outline-none" />
        </div>
      );
    }
    return (
      <div onClick={() => setEditing(key(p.id, "edicao_range"))} className="cursor-pointer min-h-[24px] flex items-center text-xs text-foreground">
        {p.edicao_start ? (
          <>{fmtDate(p.edicao_start)}{p.edicao_end && <span className="text-muted-foreground"> → {fmtDate(p.edicao_end)}</span>}</>
        ) : <span className="text-muted-foreground/40">—</span>}
      </div>
    );
  };

  const renderText = (p: CalendarPost, field: string) => {
    const isEd = editing === key(p.id, field);
    const val = ((p as any)[field] as string) || "";
    if (isEd) {
      return (
        <input autoFocus defaultValue={val}
          onBlur={e => commit(p.id, field, e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="w-full bg-card border border-nexus-500 rounded px-1.5 py-1 text-xs text-foreground focus:outline-none" />
      );
    }
    return (
      <div onClick={() => setEditing(key(p.id, field))} className="cursor-pointer min-h-[24px] flex items-center text-xs text-foreground">
        {val || <span className="text-muted-foreground/40">—</span>}
      </div>
    );
  };

  // cada coluna de link corresponde a uma etapa do pipeline
  const LINK_STAGE: Record<string, { status: string; approvedAt: string; label: string }> = {
    roteiro_url: { status: "roteiro_status", approvedAt: "roteiro_approved_at", label: "Roteiro" },
    gravacao_url: { status: "gravacao_status", approvedAt: "gravacao_approved_at", label: "Captação" },
    edicao_url: { status: "edicao_status", approvedAt: "edicao_approved_at", label: "Finalizado" },
  };

  const toggleReady = async (p: CalendarPost, field: string) => {
    const st = LINK_STAGE[field];
    const isReady = (p as any)[st.status] === "aprovado";
    await onUpdate(p.id, {
      [st.status]: isReady ? "pendente" : "aprovado",
      [st.approvedAt]: isReady ? null : new Date().toISOString(),
    });
  };

  const renderUrl = (p: CalendarPost, field: string) => {
    const isEd = editing === key(p.id, field);
    const val = ((p as any)[field] as string) || "";
    const st = LINK_STAGE[field];
    const isReady = (p as any)[st.status] === "aprovado";

    const checkbox = (
      <button
        onClick={e => { e.stopPropagation(); toggleReady(p, field); }}
        title={isReady ? `${st.label} pronto — clique para desmarcar` : `Marcar ${st.label} como pronto`}
        className={cn(
          "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors",
          isReady ? "bg-emerald-500 border-emerald-500" : "border-border hover:border-emerald-500/60"
        )}
      >
        {isReady && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>
    );

    if (isEd) {
      return (
        <div className="flex items-center gap-1.5">
          {checkbox}
          <input autoFocus defaultValue={val} placeholder="https://..."
            onBlur={e => commit(p.id, field, e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-full bg-card border border-nexus-500 rounded px-1.5 py-1 text-xs text-foreground focus:outline-none" />
        </div>
      );
    }
    return (
      <div className="min-h-[24px] flex items-center gap-1.5">
        {checkbox}
        {val ? (
          <>
            <a href={val} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className={cn("text-xs hover:underline truncate max-w-[100px]", isReady ? "text-emerald-400" : "text-nexus-400")}>{val}</a>
            <button onClick={() => setEditing(key(p.id, field))} className="text-muted-foreground/50 hover:text-foreground text-[10px]">✎</button>
          </>
        ) : (
          <div onClick={() => setEditing(key(p.id, field))} className="cursor-pointer w-full text-muted-foreground/40 text-xs">—</div>
        )}
      </div>
    );
  };

  const cell = (p: CalendarPost, colKey: string) => {
    switch (colKey) {
      case "captacao_date":
      case "scheduled_date": return renderDate(p, colKey);
      case "edicao_range": return renderRange(p);
      case "participante": return renderSelect(p, "participante", PARTICIPANTES);
      case "responsavel_id": return renderPerson(p);
      case "type": return renderSelect(p, "type", FORMATOS);
      case "comunicacao": return renderSelect(p, "comunicacao", COMUNICACOES);
      case "tipo_conteudo": return renderSelect(p, "tipo_conteudo", TIPOS_CONTEUDO);
      case "title": return renderText(p, "title");
      case "roteiro_url":
      case "gravacao_url":
      case "edicao_url": return renderUrl(p, colKey);
      default: return null;
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-xs text-muted-foreground">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
        <button onClick={onCreate} disabled={creating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-nexus-600 hover:bg-nexus-500 text-white text-xs font-medium transition-colors disabled:opacity-60">
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Adicionar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ minWidth: "100%" }}>
          <thead>
            <tr className="border-b border-border bg-accent/20">
              {COLS.map(c => (
                <th key={c.key} style={{ width: c.w, minWidth: c.w }}
                  className="px-3 py-2.5 text-left border-r border-border/40">
                  <div className="flex items-center gap-1.5">
                    <c.icon className="w-3 h-3 text-muted-foreground/70" />
                    <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{c.label}</span>
                  </div>
                </th>
              ))}
              <th style={{ width: 72, minWidth: 72 }} className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={COLS.length + 1} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum post ainda</td></tr>
            ) : posts.map(p => (
              <tr key={p.id} className="border-b border-border/40 hover:bg-accent/10 transition-colors group">
                {COLS.map(c => (
                  <td key={c.key} style={{ width: c.w, minWidth: c.w }}
                    className="px-3 py-2 border-r border-border/20 align-middle">
                    {cell(p, c.key)}
                  </td>
                ))}
                {/* Ações da linha */}
                <td style={{ width: 72, minWidth: 72 }} className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onDuplicate(p)}
                      title="Duplicar linha"
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      title="Excluir linha"
                      className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={onCreate} disabled={creating}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors border-t border-border disabled:opacity-60">
        {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Novo
      </button>
    </div>
  );
}
