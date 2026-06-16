import type { CalendarPost, StageStatus } from "./supabase";

// Definição das 4 etapas do pipeline de conteúdo
export type StageKey = "roteiro" | "gravacao" | "edicao" | "publicacao";

export type StageDef = {
  key: StageKey;
  label: string;
  short: string;
  ownerName: string;   // membro padrão responsável
  ownerRole: string;
  color: string;
  statusField: keyof CalendarPost;
  approvedField: keyof CalendarPost;
  onlyTypes?: string[]; // se definido, etapa só aplica a esses tipos
};

export const STAGES: StageDef[] = [
  {
    key: "roteiro", label: "Roteiro", short: "R",
    ownerName: "Gerval", ownerRole: "copywriter", color: "#6366f1",
    statusField: "roteiro_status", approvedField: "roteiro_approved_at",
  },
  {
    key: "gravacao", label: "Gravação", short: "G",
    ownerName: "Guto", ownerRole: "videomaker", color: "#a78bfa",
    statusField: "gravacao_status", approvedField: "gravacao_approved_at",
    onlyTypes: ["reel", "story"],
  },
  {
    key: "edicao", label: "Edição", short: "E",
    ownerName: "Petterson", ownerRole: "social_media", color: "#34d399",
    statusField: "edicao_status", approvedField: "edicao_approved_at",
  },
  {
    key: "publicacao", label: "Publicação", short: "P",
    ownerName: "Karina", ownerRole: "social_media", color: "#fb923c",
    statusField: "publicacao_status", approvedField: "publicacao_approved_at",
  },
];

export const TIPOS_POST = ["reel", "story", "carrossel", "foto"];

// Tipo de conteúdo esperado em cada etapa (para upload/acesso)
export const STAGE_CONTENT: Record<StageKey, {
  label: string;        // descrição do formato
  placeholder: string;  // placeholder do input de link
  accessLabel: string;  // texto do botão de acesso
  kind: "doc" | "media" | "link";
}> = {
  roteiro:    { label: "PDF ou DOC", placeholder: "Link do roteiro (PDF/DOC)...", accessLabel: "Acessar roteiro", kind: "doc" },
  gravacao:   { label: "Imagem ou vídeo", placeholder: "Link da gravação (imagem/vídeo)...", accessLabel: "Acessar gravação", kind: "media" },
  edicao:     { label: "Imagem ou vídeo", placeholder: "Link do arquivo final (imagem/vídeo)...", accessLabel: "Acessar edição", kind: "media" },
  publicacao: { label: "Link do post", placeholder: "Link do post publicado...", accessLabel: "Ver post publicado", kind: "link" },
};

export const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  entregue: "Entregue (aguardando aprovação)",
  aprovado: "Aprovado",
  ajustes: "Em ajustes",
};

export const STAGE_STATUS_STYLE: Record<StageStatus, string> = {
  pendente: "text-gray-400 bg-gray-400/10",
  em_andamento: "text-sky-400 bg-sky-400/10",
  entregue: "text-orange-400 bg-orange-400/10",
  aprovado: "text-emerald-400 bg-emerald-400/10",
  ajustes: "text-red-400 bg-red-400/10",
};

// Mapeia um funcionário para a etapa que ele opera
const NAME_TO_STAGE: Record<string, StageKey> = {
  Gerval: "roteiro", Guto: "gravacao", Petterson: "edicao", Karina: "publicacao",
};
export function stageForMember(m: { name: string; role: string }): StageDef | null {
  const byName = NAME_TO_STAGE[m.name];
  if (byName) return STAGES.find(s => s.key === byName) || null;
  if (m.role === "copywriter") return STAGES[0];
  if (m.role === "videomaker") return STAGES[1];
  return null;
}

// Etapas aplicáveis a um post (gravação só para reels/stories)
export function applicableStages(post: CalendarPost): StageDef[] {
  return STAGES.filter(s => !s.onlyTypes || s.onlyTypes.includes(post.type));
}

export function stageStatus(post: CalendarPost, stage: StageDef): StageStatus {
  return (post[stage.statusField] as StageStatus) || "pendente";
}

// Uma etapa está "liberada" quando a etapa aplicável anterior foi aprovada
export function isStageUnlocked(post: CalendarPost, stage: StageDef): boolean {
  const stages = applicableStages(post);
  const idx = stages.findIndex(s => s.key === stage.key);
  if (idx <= 0) return true; // primeira etapa sempre liberada
  const prev = stages[idx - 1];
  return stageStatus(post, prev) === "aprovado";
}

// Etapa "ativa" = primeira aplicável que ainda não foi aprovada
export function activeStage(post: CalendarPost): StageDef | null {
  const stages = applicableStages(post);
  for (const s of stages) {
    if (stageStatus(post, s) !== "aprovado") return s;
  }
  return null; // tudo aprovado = concluído
}

export function isConcluido(post: CalendarPost): boolean {
  return activeStage(post) === null;
}

// Progresso 0..1 baseado em etapas aprovadas
export function progress(post: CalendarPost): number {
  const stages = applicableStages(post);
  const done = stages.filter(s => stageStatus(post, s) === "aprovado").length;
  return done / stages.length;
}

// Posts aguardando aprovação do Eliab em alguma etapa
export function awaitingApproval(post: CalendarPost): StageDef | null {
  for (const s of applicableStages(post)) {
    if (stageStatus(post, s) === "entregue") return s;
  }
  return null;
}

// Mapa de campos por etapa para montar updates
export const STAGE_FIELDS: Record<StageKey, {
  status: string; doneAt?: string; approvedAt: string; byField: string;
  deliverable: string[]; // campos preenchidos na entrega
}> = {
  roteiro: { status: "roteiro_status", doneAt: "roteiro_done_at", approvedAt: "roteiro_approved_at", byField: "roteiro_by", deliverable: ["roteiro_text", "roteiro_url"] },
  gravacao: { status: "gravacao_status", doneAt: "gravacao_done_at", approvedAt: "gravacao_approved_at", byField: "gravacao_by", deliverable: ["gravacao_url"] },
  edicao: { status: "edicao_status", doneAt: "edicao_done_at", approvedAt: "edicao_approved_at", byField: "edicao_by", deliverable: ["edicao_url"] },
  publicacao: { status: "publicacao_status", approvedAt: "publicacao_approved_at", byField: "publicacao_by", deliverable: ["post_link"] },
};
