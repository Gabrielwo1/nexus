"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  X, ChevronLeft, ChevronRight, Download, Share2, Loader2,
  FileVideo, FileImage, FileAudio, FileText, File as FileIcon, ExternalLink,
} from "lucide-react";

export type Arquivo = { key: string; name: string; size: number; updatedAt: string | null };

export const kindOf = (nome: string) => {
  const e = nome.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "webm", "m4v"].includes(e)) return "video" as const;
  if (["avi", "mkv"].includes(e)) return "video-raro" as const;      // navegador não toca
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(e)) return "image" as const;
  if (["heic", "heif", "raw", "cr2", "nef"].includes(e)) return "image-raro" as const;
  if (["mp3", "wav", "aac", "m4a", "ogg"].includes(e)) return "audio" as const;
  if (e === "pdf") return "pdf" as const;
  if (["doc", "docx", "txt", "psd", "ai"].includes(e)) return "doc" as const;
  return "file" as const;
};

export const ICON: Record<string, React.ElementType> = {
  video: FileVideo, "video-raro": FileVideo, image: FileImage, "image-raro": FileImage,
  audio: FileAudio, pdf: FileText, doc: FileText, file: FileIcon,
};
export const COR: Record<string, string> = {
  video: "#a855f7", "video-raro": "#a855f7", image: "#34d399", "image-raro": "#34d399",
  audio: "#f472b6", pdf: "#ef4444", doc: "#f59e0b", file: "#8a94a6",
};

export const fmtBytes = (b: number) => {
  if (!b) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
};

/** Visualizador em tela cheia, com navegação entre os arquivos da pasta */
export default function Visualizador({
  arquivos, indice, urls, onFechar, onNavegar, onBaixar, onCopiarLink,
}: {
  arquivos: Arquivo[];
  indice: number;
  urls: Record<string, string>;
  onFechar: () => void;
  onNavegar: (novo: number) => void;
  onBaixar: (a: Arquivo) => void;
  onCopiarLink: (a: Arquivo) => void;
}) {
  const atual = arquivos[indice];
  const [carregando, setCarregando] = useState(true);
  const url = atual ? urls[atual.key] : undefined;
  const kind = atual ? kindOf(atual.name) : "file";

  const anterior = useCallback(() => onNavegar((indice - 1 + arquivos.length) % arquivos.length), [indice, arquivos.length, onNavegar]);
  const proximo = useCallback(() => onNavegar((indice + 1) % arquivos.length), [indice, arquivos.length, onNavegar]);

  useEffect(() => { setCarregando(true); }, [indice]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proximo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFechar, anterior, proximo]);

  if (!atual) return null;
  const Icon = ICON[kind];

  const conteudo = () => {
    if (!url) return <Loader2 className="w-8 h-8 animate-spin text-white/50" />;

    switch (kind) {
      case "image":
        return (
          <img src={url} alt={atual.name} onLoad={() => setCarregando(false)}
            className="max-w-full max-h-full object-contain rounded-lg" />
        );
      case "video":
        return (
          <video src={url} controls autoPlay playsInline onLoadedData={() => setCarregando(false)}
            className="max-w-full max-h-full rounded-lg bg-black" />
        );
      case "audio":
        return (
          <div className="w-full max-w-lg text-center">
            <div className="w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: COR.audio + "22" }}>
              <FileAudio className="w-10 h-10" style={{ color: COR.audio }} />
            </div>
            <audio src={url} controls autoPlay onLoadedData={() => setCarregando(false)} className="w-full" />
          </div>
        );
      case "pdf":
        return (
          <iframe src={url} onLoad={() => setCarregando(false)}
            className="w-full h-full rounded-lg bg-white" title={atual.name} />
        );
      default:
        return (
          <div className="text-center">
            <div className="w-24 h-24 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: COR[kind] + "22" }}>
              <Icon className="w-10 h-10" style={{ color: COR[kind] }} />
            </div>
            <p className="text-white font-medium mb-1">{atual.name}</p>
            <p className="text-white/50 text-sm mb-5">
              {kind === "video-raro" ? "Formato que o navegador não reproduz"
                : kind === "image-raro" ? "Formato de imagem sem prévia no navegador"
                : "Sem prévia para este tipo de arquivo"}
            </p>
            <button onClick={() => onBaixar(atual)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-nexus-600 hover:bg-nexus-500 text-white text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Baixar para abrir
            </button>
          </div>
        );
    }
  };

  const temPrevia = ["image", "video", "audio", "pdf"].includes(kind);

  return (
    <div className="fixed inset-0 z-[60] bg-black/92 backdrop-blur-sm flex flex-col" onClick={onFechar}>
      {/* topo */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="w-5 h-5 flex-shrink-0" style={{ color: COR[kind] }} />
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">{atual.name}</p>
            <p className="text-[11px] text-white/45">
              {fmtBytes(atual.size)} · {indice + 1} de {arquivos.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onCopiarLink(atual)} title="Copiar link"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => onBaixar(atual)} title="Baixar"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir em nova aba"
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button onClick={onFechar} title="Fechar (Esc)"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* palco */}
      <div className="flex-1 flex items-center justify-center px-16 pb-4 min-h-0 relative"
        onClick={e => e.stopPropagation()}>
        {carregando && temPrevia && url && (
          <Loader2 className="absolute w-8 h-8 animate-spin text-white/40" />
        )}
        {conteudo()}
      </div>

      {/* navegação */}
      {arquivos.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); anterior(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={e => { e.stopPropagation(); proximo(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* tira de miniaturas */}
      {arquivos.length > 1 && (
        <div className="flex-shrink-0 px-5 py-3 flex gap-2 overflow-x-auto justify-center"
          onClick={e => e.stopPropagation()}>
          {arquivos.map((a, i) => {
            const k = kindOf(a.name);
            const I = ICON[k];
            const u = urls[a.key];
            return (
              <button key={a.key} onClick={() => onNavegar(i)}
                title={a.name}
                className={cn("w-16 h-11 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center border-2 transition-all",
                  i === indice ? "border-nexus-400 opacity-100" : "border-transparent opacity-45 hover:opacity-80")}
                style={{ background: COR[k] + "1a" }}>
                {k === "image" && u
                  ? <img src={u} alt="" className="w-full h-full object-cover" />
                  : <I className="w-4 h-4" style={{ color: COR[k] }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
