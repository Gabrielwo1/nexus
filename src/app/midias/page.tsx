"use client";

import { useState, useMemo } from "react";
import { ACERVO, USO, type Node } from "@/lib/midias-mock";
import { cn } from "@/lib/utils";
import {
  Folder, FolderOpen, ChevronRight, ChevronDown, Search, UploadCloud,
  LayoutGrid, List, FileVideo, FileImage, FileText, FileAudio, X,
  Download, Share2, Trash2, MoreHorizontal, HardDrive, Plus, ArrowLeft,
  Clock, User as UserIcon, Info,
} from "lucide-react";

/* ============================================================
   Acervo de Mídias — estrutura visual (upload será conectado ao R2)
   ============================================================ */

const ICON: Record<Node["kind"], React.ElementType> = {
  folder: Folder, video: FileVideo, image: FileImage, doc: FileText, audio: FileAudio,
};
const COR: Record<Node["kind"], string> = {
  folder: "#20bced", video: "#a855f7", image: "#34d399", doc: "#f59e0b", audio: "#f472b6",
};

/** encontra o caminho até um nó */
function acharCaminho(raiz: Node, alvoId: string, trilha: Node[] = []): Node[] | null {
  const atual = [...trilha, raiz];
  if (raiz.id === alvoId) return atual;
  for (const c of raiz.children || []) {
    const r = acharCaminho(c, alvoId, atual);
    if (r) return r;
  }
  return null;
}

function contar(n: Node): { pastas: number; arquivos: number } {
  let pastas = 0, arquivos = 0;
  (n.children || []).forEach(c => {
    if (c.kind === "folder") pastas++;
    else arquivos++;
  });
  return { pastas, arquivos };
}

/* ---------- árvore lateral ---------- */
function Arvore({ node, atualId, onSelect, nivel = 0 }: {
  node: Node; atualId: string; onSelect: (n: Node) => void; nivel?: number;
}) {
  const [aberto, setAberto] = useState(nivel < 1);
  const pastas = (node.children || []).filter(c => c.kind === "folder");
  const ativo = node.id === atualId;

  return (
    <div>
      <button
        onClick={() => { onSelect(node); setAberto(true); }}
        className={cn(
          "w-full flex items-center gap-1.5 pr-2 py-1.5 rounded-md text-left transition-colors group",
          ativo ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
        style={{ paddingLeft: 8 + nivel * 12 }}
      >
        <span
          onClick={e => { e.stopPropagation(); setAberto(!aberto); }}
          className={cn("flex-shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-accent",
            !pastas.length && "invisible")}
        >
          {aberto ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
        {aberto && pastas.length
          ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ativo ? "#20bced" : undefined }} />
          : <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ativo ? "#20bced" : undefined }} />}
        <span className="text-[12.5px] truncate">{node.name}</span>
      </button>
      {aberto && pastas.map(p => (
        <Arvore key={p.id} node={p} atualId={atualId} onSelect={onSelect} nivel={nivel + 1} />
      ))}
    </div>
  );
}

export default function MidiasPage() {
  const [atual, setAtual] = useState<Node>(ACERVO);
  const [sel, setSel] = useState<Node | null>(null);
  const [vista, setVista] = useState<"grid" | "lista">("grid");
  const [busca, setBusca] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const caminho = useMemo(() => acharCaminho(ACERVO, atual.id) || [ACERVO], [atual]);
  const itens = (atual.children || []).filter(n =>
    !busca || n.name.toLowerCase().includes(busca.toLowerCase())
  );
  const pastas = itens.filter(n => n.kind === "folder");
  const arquivos = itens.filter(n => n.kind !== "folder");
  const { pastas: qtdP, arquivos: qtdA } = contar(atual);
  const pctUso = Math.round((USO.usadoGB / USO.totalGB) * 100);

  const abrir = (n: Node) => {
    if (n.kind === "folder") { setAtual(n); setSel(null); }
    else setSel(n);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== ÁRVORE ===== */}
      <aside className="w-64 border-r border-border bg-card/40 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-nexus-400" />
            <span className="text-sm font-semibold text-foreground">Acervo</span>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-nexus-600 hover:bg-nexus-500 text-white text-xs font-medium transition-colors">
            <UploadCloud className="w-3.5 h-3.5" /> Enviar arquivos
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <Arvore node={ACERVO} atualId={atual.id} onSelect={n => { setAtual(n); setSel(null); }} />
        </div>

        {/* uso do bucket */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Armazenamento</span>
            <span className="text-[11px] text-foreground font-medium">{pctUso}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-accent overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-nexus-500 to-nexus-300"
              style={{ width: `${pctUso}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {USO.usadoGB} GB de {USO.totalGB / 1024} TB · Cloudflare R2
          </p>
        </div>
      </aside>

      {/* ===== CONTEÚDO ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* toolbar */}
        <div className="px-6 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-4">
            {/* breadcrumb */}
            <div className="flex items-center gap-1 min-w-0 flex-wrap">
              {caminho.length > 1 && (
                <button onClick={() => setAtual(caminho[caminho.length - 2])}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors mr-1">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {caminho.map((n, i) => (
                <span key={n.id} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />}
                  <button onClick={() => { setAtual(n); setSel(null); }}
                    className={cn("px-1.5 py-1 rounded-md text-sm truncate transition-colors",
                      i === caminho.length - 1
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                    {n.name}
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar nesta pasta..."
                  className="bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 w-56" />
              </div>
              <div className="flex gap-0.5 border border-border rounded-lg p-0.5">
                <button onClick={() => setVista("grid")}
                  className={cn("p-1.5 rounded-md transition-colors",
                    vista === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setVista("lista")}
                  className={cn("p-1.5 rounded-md transition-colors",
                    vista === "lista" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Plus className="w-3.5 h-3.5" /> Nova pasta
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {qtdP} {qtdP === 1 ? "pasta" : "pastas"} · {qtdA} {qtdA === 1 ? "arquivo" : "arquivos"}
          </p>
        </div>

        {/* área principal */}
        <div
          className={cn("flex-1 overflow-y-auto p-6 transition-colors",
            dragOver && "bg-nexus-600/5")}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); }}
        >
          {itens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
                <UploadCloud className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground font-medium">Pasta vazia</p>
              <p className="text-xs text-muted-foreground">Arraste arquivos aqui para enviar</p>
            </div>
          ) : vista === "grid" ? (
            <>
              {pastas.length > 0 && (
                <>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Pastas</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
                    {pastas.map(p => {
                      const n = contar(p);
                      return (
                        <button key={p.id} onDoubleClick={() => abrir(p)} onClick={() => abrir(p)}
                          className="group flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-nexus-500/40 hover:bg-accent/30 transition-all text-left">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "#20bced1a" }}>
                            <Folder className="w-4.5 h-4.5" style={{ color: "#20bced" }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {n.pastas > 0 && `${n.pastas} pastas`}
                              {n.pastas > 0 && n.arquivos > 0 && " · "}
                              {n.arquivos > 0 && `${n.arquivos} arquivos`}
                              {n.pastas === 0 && n.arquivos === 0 && "vazia"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {arquivos.length > 0 && (
                <>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Arquivos</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                    {arquivos.map(a => {
                      const Icon = ICON[a.kind];
                      const cor = COR[a.kind];
                      return (
                        <button key={a.id} onClick={() => setSel(a)}
                          className={cn("group rounded-xl border bg-card overflow-hidden text-left transition-all hover:-translate-y-0.5",
                            sel?.id === a.id ? "border-nexus-500" : "border-border hover:border-nexus-500/40")}>
                          {/* preview */}
                          <div className="aspect-video relative flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${cor}14, transparent)` }}>
                            <Icon className="w-7 h-7" style={{ color: cor, opacity: 0.7 }} />
                            {a.duration && (
                              <span className="absolute bottom-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                                {a.duration}
                              </span>
                            )}
                          </div>
                          <div className="p-2.5">
                            <p className="text-[12px] text-foreground truncate">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{a.size}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            /* ---------- lista ---------- */
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-accent/20">
                    {["Nome", "Tamanho", "Modificado", "Por", ""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itens.map(n => {
                    const Icon = ICON[n.kind];
                    const cor = COR[n.kind];
                    return (
                      <tr key={n.id} onClick={() => abrir(n)}
                        className="hover:bg-accent/20 transition-colors cursor-pointer group">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cor }} />
                            <span className="text-sm text-foreground truncate">{n.name}</span>
                            {n.duration && (
                              <span className="text-[10px] text-muted-foreground">{n.duration}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {n.kind === "folder" ? "—" : n.size}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{n.updatedAt || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{n.by || "—"}</td>
                        <td className="px-4 py-2.5">
                          <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-all">
                            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* zona de upload no rodapé da área */}
          <div className={cn(
            "mt-8 rounded-xl border-2 border-dashed p-6 flex items-center justify-center gap-3 transition-colors",
            dragOver ? "border-nexus-500 bg-nexus-600/10" : "border-border"
          )}>
            <UploadCloud className={cn("w-5 h-5", dragOver ? "text-nexus-400" : "text-muted-foreground")} />
            <p className="text-sm text-muted-foreground">
              Arraste vídeos e imagens aqui, ou{" "}
              <span className="text-nexus-400 font-medium cursor-pointer">selecione do computador</span>
            </p>
          </div>
        </div>
      </div>

      {/* ===== PAINEL DE DETALHE ===== */}
      {sel && sel.kind !== "folder" && (
        <aside className="w-80 border-l border-border bg-card overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Detalhes</span>
            <button onClick={() => setSel(null)} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* preview grande */}
          <div className="aspect-video flex items-center justify-center relative"
            style={{ background: `linear-gradient(135deg, ${COR[sel.kind]}18, transparent)` }}>
            {(() => { const I = ICON[sel.kind]; return <I className="w-12 h-12" style={{ color: COR[sel.kind], opacity: 0.7 }} />; })()}
            {sel.duration && (
              <span className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded bg-black/60 text-white">
                {sel.duration}
              </span>
            )}
          </div>

          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground break-words">{sel.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{sel.kind}</p>
            </div>

            <div className="space-y-2">
              {[
                { icon: Info, label: "Tamanho", value: sel.size },
                { icon: Clock, label: "Modificado", value: sel.updatedAt },
                { icon: UserIcon, label: "Enviado por", value: sel.by },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <d.icon className="w-3.5 h-3.5" /> {d.label}
                  </span>
                  <span className="text-xs text-foreground font-medium">{d.value || "—"}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-nexus-600 hover:bg-nexus-500 text-white text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> Baixar
              </button>
              <button className="flex items-center justify-center gap-2 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-4 h-4" /> Copiar link
              </button>
              <button className="flex items-center justify-center gap-2 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition-colors">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>

            {/* vínculo com o calendário */}
            <div className="rounded-lg border border-border bg-accent/20 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Vincular ao calendário</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ligue este arquivo a um conteúdo do calendário para ele aparecer na aprovação.
              </p>
              <button className="mt-2 w-full py-1.5 rounded-md border border-nexus-500/30 text-nexus-300 text-xs font-medium hover:bg-nexus-500/10 transition-colors">
                Escolher conteúdo
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
