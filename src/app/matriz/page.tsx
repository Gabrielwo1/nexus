"use client";

import { cn } from "@/lib/utils";
import {
  Network, Calendar, PenLine, Send, Stethoscope, Megaphone,
  Palette, Clapperboard, UsersRound, Bot, Globe, Building2,
  ArrowRight, Circle,
} from "lucide-react";

const ELIAB = "#20bced";
const GABRIEL = "#a855f7";

type Papel = "R" | "O"; // Responsável / Orienta
type Frente = {
  area: string;
  icon: React.ElementType;
  eliab?: Papel;
  gabriel?: Papel;
  nota?: string;
};

const SOCIOS = [
  {
    nome: "Eliab", cor: ELIAB, foco: "Conteúdo, comercial e mídia",
    frentes: ["Calendário editorial", "Copy & roteiro", "Orientação de publicação (Karyne)", "Agenda de médicos", "Tráfego pago"],
  },
  {
    nome: "Gabriel", cor: GABRIEL, foco: "Produção, produto e tecnologia",
    frentes: ["Design", "Edição de vídeos", "Orientação da produção (Guto, Augusto, Pet)", "Chatbot da clínica", "Site YPHE", "Site Instituto"],
  },
];

const FRENTES: Frente[] = [
  { area: "Calendário editorial", icon: Calendar, eliab: "R" },
  { area: "Copy & roteiro", icon: PenLine, eliab: "R" },
  { area: "Publicação (Karyne)", icon: Send, eliab: "R", nota: "Karyne executa" },
  { area: "Agenda de médicos", icon: Stethoscope, eliab: "R" },
  { area: "Tráfego pago", icon: Megaphone, eliab: "R" },
  { area: "Design", icon: Palette, gabriel: "R" },
  { area: "Edição de vídeos", icon: Clapperboard, gabriel: "R" },
  { area: "Produção (Guto, Augusto, Pet)", icon: UsersRound, gabriel: "R", nota: "orienta entregáveis" },
  { area: "Aprovação interna & do cliente", icon: Circle, gabriel: "R", nota: "revisa e conduz o portal" },
  { area: "Chatbot da clínica", icon: Bot, gabriel: "R" },
  { area: "Site YPHE", icon: Globe, gabriel: "R" },
  { area: "Site Instituto", icon: Building2, gabriel: "R" },
];

// Ciclo cronológico de produção (uma volta completa)
const TIMELINE: { fase: string; dono: string; cor: string; desc: string; icon: React.ElementType }[] = [
  { fase: "Agenda de médicos", dono: "Eliab", cor: ELIAB, icon: Stethoscope, desc: "Marca as gravações e organiza a disponibilidade dos médicos" },
  { fase: "Calendário editorial", dono: "Eliab", cor: ELIAB, icon: Calendar, desc: "Planeja o mês: temas, formatos e datas de postagem" },
  { fase: "Copy & roteiro", dono: "Eliab", cor: ELIAB, icon: PenLine, desc: "Escreve os roteiros e a linha de comunicação de cada peça" },
  { fase: "Captação / gravação", dono: "Gabriel", cor: GABRIEL, icon: Clapperboard, desc: "Guto grava o material bruto — orientação do Gabriel" },
  { fase: "Edição & design", dono: "Gabriel", cor: GABRIEL, icon: Palette, desc: "Pet e Augusto editam e criam as artes — orientação do Gabriel" },
  { fase: "Aprovação interna", dono: "Gabriel", cor: GABRIEL, icon: Circle, desc: "Revisa a entrega da produção antes de mostrar ao cliente" },
  { fase: "Aprovação do cliente", dono: "Gabriel", cor: GABRIEL, icon: Circle, desc: "Conduz a validação do cliente pelo portal (aprova ou pede ajuste)" },
  { fase: "Publicação", dono: "Eliab", cor: ELIAB, icon: Send, desc: "Karyne publica no perfil — orientação do Eliab" },
  { fase: "Tráfego pago", dono: "Eliab", cor: ELIAB, icon: Megaphone, desc: "Impulsiona os conteúdos de melhor desempenho" },
];

// Frentes contínuas (rodam em paralelo ao ciclo)
const CONTINUAS = [
  { nome: "Chatbot da clínica", dono: "Gabriel", icon: Bot },
  { nome: "Site YPHE", dono: "Gabriel", icon: Globe },
  { nome: "Site Instituto", dono: "Gabriel", icon: Building2 },
];

function PapelBadge({ papel }: { papel?: Papel }) {
  if (!papel) return <span className="text-muted-foreground/30 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-400/10 text-emerald-400">
      Responsável
    </span>
  );
}

export default function MatrizPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="brand-header px-6 py-5">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-nexus-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Matriz de Responsabilidade</h1>
            <p className="text-sm text-muted-foreground">Quem responde por cada frente e como o trabalho flui</p>
          </div>
        </div>
      </div>

      {/* Cards dos sócios */}
      <div className="grid grid-cols-2 gap-4">
        {SOCIOS.map(s => (
          <div key={s.nome} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="h-1" style={{ background: s.cor }} />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white"
                  style={{ background: s.cor }}>{s.nome[0]}</div>
                <div>
                  <p className="text-base font-semibold text-foreground">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">{s.foco}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.frentes.map(f => (
                  <span key={f} className="text-[11px] px-2 py-1 rounded-md border border-border text-muted-foreground">{f}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Matriz */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Matriz por frente</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/20">
                <th className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Frente</th>
                <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider" style={{ color: ELIAB }}>Eliab</th>
                <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider" style={{ color: GABRIEL }}>Gabriel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FRENTES.map(f => (
                <tr key={f.area} className="hover:bg-accent/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <f.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">{f.area}</p>
                        {f.nota && <p className="text-[10px] text-muted-foreground">{f.nota}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><PapelBadge papel={f.eliab} /></td>
                  <td className="px-4 py-3 text-center"><PapelBadge papel={f.gabriel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-2.5 px-1">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Responsável — responde pela frente
          </span>
        </div>
      </div>

      {/* Linha do tempo do ciclo */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Ordem cronológica do trabalho</h2>
        <p className="text-xs text-muted-foreground mb-5">Uma volta completa, da agenda do médico até o impulsionamento</p>

        <div className="relative pl-6">
          {/* linha vertical */}
          <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />
          <div className="space-y-4">
            {TIMELINE.map((t, i) => (
              <div key={t.fase} className="relative flex items-start gap-4">
                <div className="absolute -left-6 mt-0.5 w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center bg-background"
                  style={{ borderColor: t.cor }}>
                  <span className="text-[9px] font-bold" style={{ color: t.cor }}>{i + 1}</span>
                </div>
                <div className="flex-1 rounded-xl border border-border bg-card p-4 ml-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <t.icon className="w-4 h-4" style={{ color: t.cor }} />
                      <p className="text-sm font-medium text-foreground">{t.fase}</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: t.cor + "1f", color: t.cor }}>{t.dono}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ciclo se repete */}
        <div className="flex items-center gap-2 mt-4 pl-1 text-xs text-muted-foreground">
          <ArrowRight className="w-3.5 h-3.5" /> e o ciclo recomeça a cada nova leva de conteúdo
        </div>
      </div>

      {/* Frentes contínuas */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Frentes contínuas</h2>
        <p className="text-xs text-muted-foreground mb-4">Rodam em paralelo, sem depender do ciclo de conteúdo</p>
        <div className="grid grid-cols-3 gap-4">
          {CONTINUAS.map(c => (
            <div key={c.nome} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: GABRIEL + "1f" }}>
                <c.icon className="w-4 h-4" style={{ color: GABRIEL }} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{c.nome}</p>
                <p className="text-[11px] text-muted-foreground">{c.dono}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
