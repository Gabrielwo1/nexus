"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Play,
  Filter,
  Search,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";

const midias = [
  {
    id: "1",
    titulo: "Reel - Dr. Mussi - Procedimento Facial",
    tipo: "reel",
    enviado_por: "Guto",
    cliente: "Dr. Mussi",
    duracao: "0:34",
    thumbnail: null,
    enviado_em: "há 5min",
    status: "pendente",
    url: "https://pub-0ece7370b83042e198d87ead46aeff51.r2.dev/reels/mussi-facial.mp4",
  },
  {
    id: "2",
    titulo: "Stories - Clínica Vita - Promoção Junho",
    tipo: "stories",
    enviado_por: "Augusto",
    cliente: "Clínica Vita",
    duracao: "0:15",
    thumbnail: null,
    enviado_em: "há 22min",
    status: "pendente",
    url: "",
  },
  {
    id: "3",
    titulo: "Reel - Instituto Mussi - Boas vindas",
    tipo: "reel",
    enviado_por: "Guto",
    cliente: "Instituto Mussi",
    duracao: "0:28",
    thumbnail: null,
    enviado_em: "há 1h",
    status: "pendente",
    url: "",
  },
  {
    id: "4",
    titulo: "Stories - Dr. Costa - Antes e Depois",
    tipo: "stories",
    enviado_por: "Augusto",
    cliente: "Dr. Costa",
    duracao: "0:12",
    thumbnail: null,
    enviado_em: "há 2h",
    status: "aprovado",
    url: "",
  },
  {
    id: "5",
    titulo: "Reel - Clínica Zen - Meditação",
    tipo: "reel",
    enviado_por: "Guto",
    cliente: "Clínica Zen",
    duracao: "0:45",
    thumbnail: null,
    enviado_em: "há 3h",
    status: "rejeitado",
    url: "",
  },
];

type StatusFilter = "todos" | "pendente" | "aprovado" | "rejeitado";

export default function AprovacoesPage() {
  const [filtroStatus, setFiltroStatus] = useState<StatusFilter>("pendente");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(midias.map((m) => [m.id, m.status]))
  );

  const filtradas = midias.filter((m) => {
    if (filtroStatus !== "todos" && statuses[m.id] !== filtroStatus) return false;
    if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return false;
    return true;
  });

  const selected = midias.find((m) => m.id === selectedId);

  const aprovar = (id: string) => {
    setStatuses((s) => ({ ...s, [id]: "aprovado" }));
    setSelectedId(null);
  };

  const rejeitar = (id: string) => {
    setStatuses((s) => ({ ...s, [id]: "rejeitado" }));
    setSelectedId(null);
    setComentario("");
  };

  const pendentes = Object.values(statuses).filter((s) => s === "pendente").length;

  return (
    <div className="flex h-full">
      {/* Lista */}
      <div className="w-96 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-base font-bold text-foreground">Aprovações</h1>
            {pendentes > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-400/10 text-orange-400">
                {pendentes} pendentes
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Mídias enviadas pela equipe via Telegram</p>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full bg-accent/50 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
              placeholder="Buscar mídia..."
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-1.5 mt-3">
            {(["todos", "pendente", "aprovado", "rejeitado"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all",
                  filtroStatus === s
                    ? "bg-nexus-600/20 text-nexus-300"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 mt-2">
            {["todos", "reel", "stories"].map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all",
                  filtroTipo === t
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "todos" ? "Todos tipos" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtradas.map((midia) => {
            const status = statuses[midia.id];
            const isSelected = selectedId === midia.id;
            return (
              <button
                key={midia.id}
                onClick={() => setSelectedId(isSelected ? null : midia.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  isSelected
                    ? "border-nexus-500/50 bg-nexus-600/10"
                    : "border-border bg-card hover:border-border/80 hover:bg-accent/30"
                )}
              >
                {/* Thumbnail placeholder */}
                <div className="w-full h-24 rounded-lg bg-accent flex items-center justify-center mb-2.5 relative overflow-hidden">
                  <Play className="w-6 h-6 text-muted-foreground" />
                  <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {midia.duracao}
                  </span>
                  <span
                    className={cn(
                      "absolute top-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize",
                      midia.tipo === "reel"
                        ? "bg-nexus-500/80 text-white"
                        : "bg-violet-500/80 text-white"
                    )}
                  >
                    {midia.tipo}
                  </span>
                </div>

                <p className="text-xs font-medium text-foreground line-clamp-1">{midia.titulo}</p>

                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <User className="w-3 h-3" />
                    {midia.enviado_por} · {midia.cliente}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      status === "pendente" && "bg-orange-400/10 text-orange-400",
                      status === "aprovado" && "bg-emerald-400/10 text-emerald-400",
                      status === "rejeitado" && "bg-red-400/10 text-red-400"
                    )}
                  >
                    {status}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                  <Clock className="w-2.5 h-2.5" />
                  {midia.enviado_em}
                </div>
              </button>
            );
          })}

          {filtradas.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma mídia encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview / Ações */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            {/* Player */}
            <div className="flex-1 bg-black flex items-center justify-center relative">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <p className="text-white/60 text-sm">Player conectado ao R2</p>
                <p className="text-white/40 text-xs">{selected.titulo}</p>
              </div>
            </div>

            {/* Ações */}
            <div className="p-6 border-t border-border bg-card space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{selected.titulo}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enviado por {selected.enviado_por} · {selected.cliente} · {selected.enviado_em}
                </p>
              </div>

              {statuses[selected.id] === "pendente" && (
                <>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground" />
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Comentário (opcional para aprovação, obrigatório para rejeição)..."
                      rows={3}
                      className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => rejeitar(selected.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeitar
                    </button>
                    <button
                      onClick={() => aprovar(selected.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aprovar
                    </button>
                  </div>
                </>
              )}

              {statuses[selected.id] === "aprovado" && (
                <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm text-emerald-400 font-medium">Mídia aprovada</p>
                </div>
              )}

              {statuses[selected.id] === "rejeitado" && (
                <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400 font-medium">Mídia rejeitada</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Play className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Selecione uma mídia para visualizar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
