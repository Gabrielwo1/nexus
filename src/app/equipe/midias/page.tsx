"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Midia, Client, TeamMember } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  FolderImage, Search, Filter, Play, Download,
  Image as ImageIcon, Music, FileText, Plus, Loader2,
} from "lucide-react";

const TIPOS = ["reel", "stories", "foto", "audio", "design"];
const STATUS_OPTS = ["todos", "pendente", "aprovado", "rejeitado"];

const tipoIcon: Record<string, React.ElementType> = {
  reel: Play, stories: Play, foto: ImageIcon, audio: Music, design: FileText,
};

const tipoCor: Record<string, string> = {
  reel: "text-nexus-400 bg-nexus-400/10",
  stories: "text-violet-400 bg-violet-400/10",
  foto: "text-sky-400 bg-sky-400/10",
  audio: "text-emerald-400 bg-emerald-400/10",
  design: "text-orange-400 bg-orange-400/10",
};

const statusCor: Record<string, string> = {
  pendente: "text-orange-400 bg-orange-400/10",
  aprovado: "text-emerald-400 bg-emerald-400/10",
  rejeitado: "text-red-400 bg-red-400/10",
};

export default function MidiasPage() {
  const [midias, setMidias] = useState<Midia[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [clienteFiltro, setClienteFiltro] = useState("todos");

  useEffect(() => {
    Promise.all([
      supabase.from("midias").select("*, clients(name), team_members(name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name").eq("status", "active").order("name"),
    ]).then(([m, c]) => {
      setMidias((m.data as any) || []);
      setClients(c.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = midias.filter((m) => {
    if (search && !m.file_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFiltro !== "todos" && m.status !== statusFiltro) return false;
    if (tipoFiltro !== "todos" && m.type !== tipoFiltro) return false;
    if (clienteFiltro !== "todos" && m.client_id !== clienteFiltro) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderImage className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Armazenamento de Mídias</h1>
            <p className="text-sm text-muted-foreground">{midias.length} arquivos · Recebidos via Telegram</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar arquivo..."
            className="bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 w-56"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => setStatusFiltro(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all", statusFiltro === s ? "bg-nexus-600/20 text-nexus-300 border border-nexus-500/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
              {s === "todos" ? "Todos" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {["todos", ...TIPOS].map((t) => (
            <button key={t} onClick={() => setTipoFiltro(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all", tipoFiltro === t ? "bg-sky-400/20 text-sky-300 border border-sky-400/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
              {t === "todos" ? "Todos tipos" : t}
            </button>
          ))}
        </div>
        <select
          value={clienteFiltro}
          onChange={(e) => setClienteFiltro(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
        >
          <option value="todos">Todos clientes</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="h-40 rounded-xl shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FolderImage className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Nenhuma mídia encontrada</p>
          <p className="text-muted-foreground text-xs">As mídias aparecem aqui quando a equipe envia via Telegram</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {filtered.map((midia) => {
            const Icon = tipoIcon[midia.type] || FileText;
            return (
              <div key={midia.id} className="glass rounded-xl overflow-hidden group hover:border-nexus-500/30 border border-transparent transition-all">
                <div className="relative h-32 bg-accent flex items-center justify-center">
                  {midia.file_url && (midia.type === "reel" || midia.type === "stories") ? (
                    <video src={midia.file_url} className="w-full h-full object-cover" muted />
                  ) : midia.file_url && midia.type === "foto" ? (
                    <img src={midia.file_url} alt={midia.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-8 h-8 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {midia.file_url && (
                      <a href={midia.file_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Download className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                  </div>
                  <span className={cn("absolute top-2 left-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full", tipoCor[midia.type] || "text-muted-foreground bg-accent")}>
                    {midia.type}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-foreground truncate mb-1">{midia.file_name}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">{(midia as any).clients?.name} · {(midia as any).team_members?.name}</p>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", statusCor[midia.status])}>
                      {midia.status}
                    </span>
                    {midia.duration_sec && (
                      <span className="text-[9px] text-muted-foreground">{midia.duration_sec}s</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
