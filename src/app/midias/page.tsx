"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Folder, FolderOpen, ChevronRight, Search, UploadCloud, Loader2,
  LayoutGrid, List, FileVideo, FileImage, FileText, FileAudio, File as FileIcon,
  X, Download, Share2, Trash2, HardDrive, Plus, ArrowLeft, RefreshCw,
  Clock, Info, CheckCircle2, AlertCircle, Eye, Pencil, Link2,
} from "lucide-react";
import Visualizador, { kindOf, ICON, COR, fmtBytes } from "@/components/midias/Visualizador";
import VincularModal from "@/components/midias/VincularModal";

/* ============================================================
   Acervo de Mídias — Cloudflare R2
   Upload direto do navegador para o bucket (não passa pelo servidor),
   por isso aguenta vídeo de vários GB.
   ============================================================ */

type Pasta = { name: string; prefix: string };
type Arquivo = { key: string; name: string; size: number; updatedAt: string | null };
type Envio = { id: string; nome: string; pct: number; estado: "enviando" | "ok" | "erro"; erro?: string };

const fmtData = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return d.toLocaleDateString("pt-BR");
};

export default function MidiasPage() {
  const [prefix, setPrefix] = useState("");
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"grid" | "lista">("grid");
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<Arquivo | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [verIndice, setVerIndice] = useState<number | null>(null);
  const [vincular, setVincular] = useState<Arquivo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/acervo/listar?prefix=${encodeURIComponent(p)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setPastas(j.pastas); setArquivos(j.arquivos);
      // assina as URLs para miniaturas e prévia
      if (j.arquivos.length) {
        fetch("/api/acervo/urls", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: j.arquivos.map((a: Arquivo) => a.key) }),
        }).then(r => r.json()).then(u => setUrls(prev => ({ ...prev, ...(u.urls || {}) }))).catch(() => {});
      }
    } catch (e: any) {
      toast.error("Erro ao carregar: " + e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(prefix); setSel(null); }, [prefix, carregar]);

  /* ---------- upload direto para o R2 ---------- */
  const enviarArquivo = (file: File) => {
    const id = Math.random().toString(36).slice(2);
    setEnvios(prev => [...prev, { id, nome: file.name, pct: 0, estado: "enviando" }]);

    fetch("/api/acervo/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, nome: file.name, contentType: file.type }),
    })
      .then(r => r.json())
      .then(({ url, error }) => {
        if (error) throw new Error(error);
        return new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = e => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setEnvios(prev => prev.map(x => x.id === id ? { ...x, pct } : x));
            }
          };
          xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
          xhr.onerror = () => reject(new Error("falha de rede"));
          xhr.send(file);
        });
      })
      .then(() => {
        setEnvios(prev => prev.map(x => x.id === id ? { ...x, pct: 100, estado: "ok" } : x));
        carregar(prefix);
        setTimeout(() => setEnvios(prev => prev.filter(x => x.id !== id)), 2500);
      })
      .catch(e => {
        setEnvios(prev => prev.map(x => x.id === id ? { ...x, estado: "erro", erro: e.message } : x));
        toast.error(`${file.name}: ${e.message}`);
      });
  };

  const receber = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach(enviarArquivo);
  };

  const novaPasta = async () => {
    const nome = prompt("Nome da nova pasta:");
    if (!nome?.trim()) return;
    const r = await fetch("/api/acervo/pasta", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, nome }),
    });
    const j = await r.json();
    if (!r.ok) { toast.error(j.error); return; }
    toast.success("Pasta criada");
    carregar(prefix);
  };

  const abrirArquivo = async (a: Arquivo, baixar = false) => {
    const r = await fetch(`/api/acervo/upload?key=${encodeURIComponent(a.key)}`);
    const j = await r.json();
    if (!r.ok) { toast.error(j.error); return; }
    if (baixar) { window.location.href = j.url; }
    else { navigator.clipboard.writeText(j.url); toast.success("Link copiado (válido por 1 hora)"); }
  };

  const excluirArquivo = async (a: Arquivo) => {
    if (!confirm(`Excluir "${a.name}"? Esta ação não pode ser desfeita.`)) return;
    const r = await fetch(`/api/acervo/arquivo?key=${encodeURIComponent(a.key)}`, { method: "DELETE" });
    if (!r.ok) { toast.error("Erro ao excluir"); return; }
    toast.success("Arquivo excluído");
    setSel(null); carregar(prefix);
  };

  const renomearPasta = async (p: Pasta) => {
    const nome = prompt("Novo nome da pasta:", p.name);
    if (!nome?.trim() || nome.trim() === p.name) return;
    const t = toast.loading("Renomeando pasta...");
    const r = await fetch("/api/acervo/pasta", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: p.prefix, novoNome: nome }),
    });
    const j = await r.json();
    toast.dismiss(t);
    if (!r.ok) { toast.error(j.error); return; }
    toast.success(j.movidos ? `Pasta renomeada (${j.movidos} itens)` : "Pasta renomeada");
    carregar(prefix);
  };

  const renomearArquivo = async (a: Arquivo) => {
    const nome = prompt("Novo nome do arquivo:", a.name);
    if (!nome?.trim() || nome.trim() === a.name) return;
    const r = await fetch("/api/acervo/arquivo", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: a.key, novoNome: nome }),
    });
    const j = await r.json();
    if (!r.ok) { toast.error(j.error); return; }
    toast.success("Arquivo renomeado");
    setSel(null); carregar(prefix);
  };

  const excluirPasta = async (p: Pasta) => {
    if (!confirm(`Excluir a pasta "${p.name}" e TODO o conteúdo dela?`)) return;
    const r = await fetch(`/api/acervo/pasta?prefix=${encodeURIComponent(p.prefix)}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) { toast.error(j.error); return; }
    toast.success(`Pasta excluída (${j.removidos} itens)`);
    carregar(prefix);
  };

  /* ---------- navegação ---------- */
  const partes = prefix ? prefix.replace(/\/$/, "").split("/") : [];
  const irPara = (i: number) => setPrefix(i < 0 ? "" : partes.slice(0, i + 1).join("/") + "/");

  const pastasF = pastas.filter(p => !busca || p.name.toLowerCase().includes(busca.toLowerCase()));
  const arquivosF = arquivos.filter(a => !busca || a.name.toLowerCase().includes(busca.toLowerCase()));
  const totalBytes = arquivos.reduce((s, a) => s + a.size, 0);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== CONTEÚDO ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* toolbar */}
        <div className="px-6 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 min-w-0 flex-wrap">
              {partes.length > 0 && (
                <button onClick={() => irPara(partes.length - 2)}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors mr-1">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => irPara(-1)}
                className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors",
                  !partes.length ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                <HardDrive className="w-3.5 h-3.5" /> Acervo
              </button>
              {partes.map((p, i) => (
                <span key={i} className="flex items-center gap-1 min-w-0">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                  <button onClick={() => irPara(i)}
                    className={cn("px-1.5 py-1 rounded-md text-sm truncate max-w-[220px] transition-colors",
                      i === partes.length - 1 ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                    {p}
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar aqui..."
                  className="bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 w-52" />
              </div>
              <button onClick={() => carregar(prefix)} title="Atualizar"
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </button>
              <div className="flex gap-0.5 border border-border rounded-lg p-0.5">
                {(["grid", "lista"] as const).map(v => (
                  <button key={v} onClick={() => setVista(v)}
                    className={cn("p-1.5 rounded-md transition-colors",
                      vista === v ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {v === "grid" ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
              <button onClick={novaPasta}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Plus className="w-3.5 h-3.5" /> Pasta
              </button>
              <button onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nexus-600 hover:bg-nexus-500 text-white text-xs font-medium transition-colors">
                <UploadCloud className="w-3.5 h-3.5" /> Enviar
              </button>
              <input ref={inputRef} type="file" multiple hidden
                onChange={e => { receber(e.target.files); e.target.value = ""; }} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {pastas.length} {pastas.length === 1 ? "pasta" : "pastas"} · {arquivos.length}{" "}
            {arquivos.length === 1 ? "arquivo" : "arquivos"}
            {totalBytes > 0 && ` · ${fmtBytes(totalBytes)}`}
          </p>
        </div>

        {/* área principal */}
        <div
          className={cn("flex-1 overflow-y-auto p-6 transition-colors relative", dragOver && "bg-nexus-600/5")}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={e => { if (e.currentTarget === e.target) setDragOver(false); }}
          onDrop={e => { e.preventDefault(); setDragOver(false); receber(e.dataTransfer.files); }}
        >
          {dragOver && (
            <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-nexus-500 bg-nexus-600/10 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center">
                <UploadCloud className="w-10 h-10 text-nexus-400 mx-auto mb-2" />
                <p className="text-sm text-nexus-300 font-medium">Solte para enviar para esta pasta</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !pastasF.length && !arquivosF.length ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
                <UploadCloud className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground font-medium">
                {busca ? "Nada encontrado" : "Pasta vazia"}
              </p>
              <p className="text-xs text-muted-foreground">Arraste arquivos aqui para enviar</p>
            </div>
          ) : vista === "grid" ? (
            <>
              {pastasF.length > 0 && (
                <>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Pastas</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
                    {pastasF.map(p => (
                      <div key={p.prefix} onClick={() => setPrefix(p.prefix)}
                        className="group relative flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-nexus-500/40 hover:bg-accent/30 transition-all cursor-pointer">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-nexus-500/10">
                          <Folder className="w-4 h-4 text-nexus-400" />
                        </div>
                        <p className="text-[13px] font-medium text-foreground truncate flex-1">{p.name}</p>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={e => { e.stopPropagation(); renomearPasta(p); }} title="Renomear pasta"
                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-nexus-400 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); excluirPasta(p); }} title="Excluir pasta"
                            className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {arquivosF.length > 0 && (
                <>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Arquivos</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                    {arquivosF.map(a => {
                      const k = kindOf(a.name);
                      const Icon = ICON[k];
                      const u = urls[a.key];
                      const idx = arquivosF.findIndex(x => x.key === a.key);
                      return (
                        <button key={a.key}
                          onClick={() => setSel(a)}
                          onDoubleClick={() => setVerIndice(idx)}
                          className={cn("group rounded-xl border bg-card overflow-hidden text-left transition-all hover:-translate-y-0.5",
                            sel?.key === a.key ? "border-nexus-500" : "border-border hover:border-nexus-500/40")}>
                          <div className="aspect-video flex items-center justify-center relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${COR[k]}14, transparent)` }}>
                            {k === "image" && u ? (
                              <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : k === "video" && u ? (
                              <video src={`${u}#t=0.5`} preload="metadata" muted playsInline
                                className="w-full h-full object-cover" />
                            ) : (
                              <Icon className="w-7 h-7" style={{ color: COR[k], opacity: 0.7 }} />
                            )}
                            {/* botão de abrir prévia */}
                            <span onClick={e => { e.stopPropagation(); setVerIndice(idx); }}
                              className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </span>
                            </span>
                          </div>
                          <div className="p-2.5">
                            <div className="flex items-center gap-1">
                              <p className="text-[12px] text-foreground truncate flex-1">{a.name}</p>
                              <span onClick={e => { e.stopPropagation(); renomearArquivo(a); }} title="Renomear arquivo"
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground hover:text-nexus-400 transition-all">
                                <Pencil className="w-3 h-3" />
                              </span>
                              <span onClick={e => { e.stopPropagation(); setVincular(a); }} title="Vincular ao calendário"
                                className="opacity-0 group-hover:opacity-100 p-1 -mr-1 rounded hover:bg-accent text-muted-foreground hover:text-nexus-400 transition-all">
                                <Link2 className="w-3 h-3" />
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{fmtBytes(a.size)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-accent/20">
                    {["Nome", "Tamanho", "Modificado", ""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pastasF.map(p => (
                    <tr key={p.prefix} onClick={() => setPrefix(p.prefix)}
                      className="hover:bg-accent/20 transition-colors cursor-pointer group">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Folder className="w-4 h-4 text-nexus-400 flex-shrink-0" />
                          <span className="text-sm text-foreground truncate">{p.name}</span>
                          <button onClick={e => { e.stopPropagation(); renomearPasta(p); }} title="Renomear pasta"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground hover:text-nexus-400 transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">—</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">—</td>
                      <td className="px-4 py-2.5">
                        <button onClick={e => { e.stopPropagation(); excluirPasta(p); }} title="Excluir pasta"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {arquivosF.map(a => {
                    const k = kindOf(a.name);
                    const Icon = ICON[k];
                    return (
                      <tr key={a.key} onClick={() => setSel(a)}
                        onDoubleClick={() => setVerIndice(arquivosF.findIndex(x => x.key === a.key))}
                        className="hover:bg-accent/20 transition-colors cursor-pointer group">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: COR[k] }} />
                            <span className="text-sm text-foreground truncate">{a.name}</span>
                            <button onClick={e => { e.stopPropagation(); setVerIndice(arquivosF.findIndex(x => x.key === a.key)); }} title="Ver prévia"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground hover:text-nexus-400 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); renomearArquivo(a); }} title="Renomear arquivo"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground hover:text-nexus-400 transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setVincular(a); }} title="Vincular ao calendário"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground hover:text-nexus-400 transition-all">
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{fmtBytes(a.size)}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{fmtData(a.updatedAt)}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={e => { e.stopPropagation(); excluirArquivo(a); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* fila de upload */}
        {envios.length > 0 && (
          <div className="border-t border-border bg-card px-6 py-3 space-y-2 max-h-48 overflow-y-auto">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Enviando ({envios.filter(e => e.estado === "enviando").length})
            </p>
            {envios.map(e => (
              <div key={e.id} className="flex items-center gap-3">
                {e.estado === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : e.estado === "erro" ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  : <Loader2 className="w-4 h-4 text-nexus-400 animate-spin flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground truncate">{e.nome}</span>
                    <span className={cn("text-[10px] flex-shrink-0 ml-2",
                      e.estado === "erro" ? "text-red-400" : "text-muted-foreground")}>
                      {e.estado === "erro" ? e.erro : `${e.pct}%`}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-accent overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all",
                      e.estado === "ok" ? "bg-emerald-500" : e.estado === "erro" ? "bg-red-500" : "bg-nexus-500")}
                      style={{ width: `${e.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== VISUALIZADOR ===== */}
      {verIndice !== null && arquivosF[verIndice] && (
        <Visualizador
          arquivos={arquivosF}
          indice={verIndice}
          urls={urls}
          onFechar={() => setVerIndice(null)}
          onNavegar={setVerIndice}
          onBaixar={a => abrirArquivo(a, true)}
          onCopiarLink={a => abrirArquivo(a, false)}
        />
      )}

      {vincular && <VincularModal arquivo={vincular} onFechar={() => setVincular(null)} />}

      {/* ===== DETALHE ===== */}
      {sel && (
        <aside className="w-80 border-l border-border bg-card overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Detalhes</span>
            <button onClick={() => setSel(null)} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="aspect-video flex items-center justify-center relative overflow-hidden cursor-pointer group"
            onClick={() => setVerIndice(arquivosF.findIndex(x => x.key === sel.key))}
            style={{ background: `linear-gradient(135deg, ${COR[kindOf(sel.name)]}18, transparent)` }}>
            {(() => {
              const k = kindOf(sel.name); const u = urls[sel.key]; const I = ICON[k];
              if (k === "image" && u) return <img src={u} alt="" className="w-full h-full object-cover" />;
              if (k === "video" && u) return <video src={`${u}#t=0.5`} preload="metadata" muted className="w-full h-full object-cover" />;
              return <I className="w-12 h-12" style={{ color: COR[k], opacity: 0.7 }} />;
            })()}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur text-white text-xs font-medium">
                <Eye className="w-3.5 h-3.5" /> Visualizar
              </span>
            </span>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-start gap-1.5">
                <p className="text-sm font-medium text-foreground break-words flex-1">{sel.name}</p>
                <button onClick={() => renomearArquivo(sel)} title="Renomear arquivo"
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-nexus-400 transition-colors flex-shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{kindOf(sel.name)}</p>
            </div>

            <div className="space-y-2">
              {[
                { icon: Info, label: "Tamanho", value: fmtBytes(sel.size) },
                { icon: Clock, label: "Modificado", value: fmtData(sel.updatedAt) },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <d.icon className="w-3.5 h-3.5" /> {d.label}
                  </span>
                  <span className="text-xs text-foreground font-medium">{d.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button onClick={() => abrirArquivo(sel, true)}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-nexus-600 hover:bg-nexus-500 text-white text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> Baixar
              </button>
              <button onClick={() => setVincular(sel)}
                className="flex items-center justify-center gap-2 py-2 rounded-lg border border-nexus-500/40 text-nexus-400 hover:bg-nexus-500/10 text-sm font-medium transition-colors">
                <Link2 className="w-4 h-4" /> Vincular ao calendário
              </button>
              <button onClick={() => abrirArquivo(sel, false)}
                className="flex items-center justify-center gap-2 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-4 h-4" /> Copiar link
              </button>
              <button onClick={() => excluirArquivo(sel)}
                className="flex items-center justify-center gap-2 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition-colors">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>

            <div className="rounded-lg border border-border bg-accent/20 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Caminho</p>
              <p className="text-[11px] text-muted-foreground break-all font-mono">{sel.key}</p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
