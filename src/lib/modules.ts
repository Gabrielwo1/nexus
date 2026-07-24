/**
 * Registro central dos módulos do sistema.
 * A permissão é por módulo habilitado em cada usuário (team_members.modules).
 * modules = null  -> acesso total (sem restrição)
 * modules = [...] -> vê apenas os módulos listados
 */
export type ModuleDef = {
  key: string;
  label: string;
  group: string;
  /** rota protegida por este módulo (usada no guard) */
  href?: string;
};

export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard", group: "Geral", href: "/" },

  { key: "equipe.branding", label: "Branding", group: "Equipe", href: "/equipe/branding" },
  { key: "equipe.calendario", label: "Calendário & Copys", group: "Equipe", href: "/equipe/calendario" },
  { key: "equipe.midias", label: "Armazenamento de Mídias", group: "Equipe" },
  { key: "equipe.aprovacoes", label: "Mídias para Aprovação", group: "Equipe", href: "/equipe/aprovacoes" },

  { key: "financeiro.visao", label: "Visão Geral", group: "Financeiro", href: "/financeiro" },
  { key: "financeiro.receitas", label: "Receitas & Gastos", group: "Financeiro", href: "/financeiro/receitas" },
  { key: "financeiro.cobrancas", label: "Cobranças", group: "Financeiro", href: "/financeiro/cobrancas" },
  { key: "financeiro.projecoes", label: "Projeções", group: "Financeiro", href: "/financeiro/projecoes" },

  { key: "crm.clientes", label: "Clientes", group: "CRM", href: "/crm" },
  { key: "crm.novo", label: "Adicionar Cliente", group: "CRM", href: "/crm/novo" },

  { key: "dados.instagram", label: "Instagram Orgânico", group: "Dados", href: "/dados/instagram" },
  { key: "dados.performance", label: "Performance Geral", group: "Dados", href: "/dados" },

  { key: "contratos", label: "Contratos", group: "Gestão", href: "/contratos" },
  { key: "tarefas", label: "Tarefas", group: "Gestão", href: "/tarefas" },
  { key: "usuarios", label: "Usuários", group: "Sistema", href: "/usuarios" },
];

export const MODULE_GROUPS = Array.from(new Set(MODULES.map(m => m.group)));

/** Conjuntos prontos para agilizar o cadastro */
export const PRESETS: { label: string; keys: string[] }[] = [
  {
    label: "Acesso total",
    keys: MODULES.map(m => m.key),
  },
  {
    label: "Produção de conteúdo",
    keys: ["dashboard", "equipe.calendario", "equipe.midias", "equipe.aprovacoes", "tarefas"],
  },
  {
    label: "Social media",
    keys: ["dashboard", "equipe.calendario", "equipe.midias", "equipe.branding", "tarefas"],
  },
  {
    label: "Financeiro",
    keys: ["dashboard", "financeiro.visao", "financeiro.receitas", "financeiro.cobrancas", "financeiro.projecoes", "contratos"],
  },
];

/** modules null = sem restrição */
export function canSee(modules: string[] | null | undefined, key: string): boolean {
  if (modules === null || modules === undefined) return true;
  return modules.includes(key);
}

/** Descobre qual módulo protege uma rota (match mais específico primeiro) */
export function moduleForPath(pathname: string): ModuleDef | undefined {
  const comHref = MODULES.filter(m => m.href);
  const exato = comHref.find(m => m.href === pathname);
  if (exato) return exato;
  return comHref
    .filter(m => m.href !== "/" && pathname.startsWith(m.href!))
    .sort((a, b) => b.href!.length - a.href!.length)[0];
}
