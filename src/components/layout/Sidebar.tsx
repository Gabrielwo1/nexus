"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { canSee } from "@/lib/modules";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  Users,
  DollarSign,
  UserCircle,
  BarChart3,
  LayoutDashboard,
  Palette,
  CalendarDays,
  FolderOpen,
  CheckSquare,
  TrendingUp,
  Receipt,
  UserPlus,
  Instagram,
  ChevronDown,
  Zap,
  FileText,
  KanbanSquare,
  ClipboardList,
  Video,
  ExternalLink,
  LogOut,
  Network,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const nav = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    label: "Equipe",
    icon: Users,
    color: "text-violet-400",
    children: [
      { label: "Branding", href: "/equipe/branding", icon: Palette, module: "equipe.branding" },
      { label: "Calendário & Copys", href: "/equipe/calendario", icon: CalendarDays, module: "equipe.calendario" },
      {
        label: "Armazenamento de Mídias",
        href: "https://drive.google.com/drive/u/0/folders/1vH8iS3wZeXvn36qzsFEohn3626IE1QvC",
        icon: FolderOpen,
        external: true,
        module: "equipe.midias",
      },
      { label: "Mídias para Aprovação", href: "/equipe/aprovacoes", icon: CheckSquare, module: "equipe.aprovacoes" },
    ],
  },
  {
    label: "Financeiro",
    icon: DollarSign,
    color: "text-emerald-400",
    children: [
      { label: "Visão Geral", href: "/financeiro", icon: TrendingUp, module: "financeiro.visao" },
      { label: "Receitas & Gastos", href: "/financeiro/receitas", icon: DollarSign, module: "financeiro.receitas" },
      { label: "Cobranças", href: "/financeiro/cobrancas", icon: Receipt, module: "financeiro.cobrancas" },
      { label: "Projeções", href: "/financeiro/projecoes", icon: BarChart3, module: "financeiro.projecoes" },
    ],
  },
  {
    label: "CRM",
    icon: UserCircle,
    color: "text-sky-400",
    children: [
      { label: "Clientes", href: "/crm", icon: UserCircle, module: "crm.clientes" },
      { label: "Adicionar Cliente", href: "/crm/novo", icon: UserPlus, module: "crm.novo" },
    ],
  },
  {
    label: "Dados",
    icon: BarChart3,
    color: "text-orange-400",
    children: [
      { label: "Instagram Orgânico", href: "/dados/instagram", icon: Instagram, module: "dados.instagram" },
      { label: "Performance Geral", href: "/dados", icon: TrendingUp, module: "dados.performance" },
    ],
  },
  {
    label: "Contratos",
    href: "/contratos",
    icon: FileText,
    module: "contratos",
  },
  {
    label: "Tarefas",
    href: "/tarefas",
    icon: KanbanSquare,
    module: "tarefas",
  },
  {
    label: "Atividades",
    href: "/atividades",
    icon: ClipboardList,
    module: "atividades",
  },
  {
    label: "Captação",
    href: "/captacao",
    icon: Video,
    module: "captacao",
  },
  {
    label: "Responsabilidades",
    href: "/matriz",
    icon: Network,
    module: "matriz",
  },
  {
    label: "Usuários",
    href: "/usuarios",
    icon: Users,
    module: "usuarios",
  },
];

function NavItem({ item }: { item: typeof nav[0] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() =>
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  );

  if (!item.children) {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href!}
        className={cn(
          "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
          active
            ? "bg-accent text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
        )}
      >
        <item.icon className={cn("w-4 h-4", active ? "text-nexus-400" : "text-muted-foreground")} />
        {item.label}
      </Link>
    );
  }

  const anyActive = item.children.some((c) => pathname.startsWith(c.href));

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
          anyActive
            ? "text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
        )}
      >
        <item.icon className={cn("w-4 h-4", anyActive ? "text-nexus-400" : "text-muted-foreground")} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-3 mt-1 space-y-0.5 border-l border-border pl-3">
              {item.children.map((child) => {
                const isExternal = "external" in child && child.external;
                const active = !isExternal && (pathname === child.href || pathname.startsWith(child.href + "/"));
                const classes = cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors duration-150",
                  active
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                );

                if (isExternal) {
                  return (
                    <a
                      key={child.href}
                      href={child.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes}
                    >
                      <child.icon className="w-3.5 h-3.5" />
                      <span className="flex-1">{child.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  );
                }

                return (
                  <Link key={child.href} href={child.href} className={classes}>
                    <child.icon className="w-3.5 h-3.5" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserBox() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nome: string; nivel: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const email = data.user?.email;
      if (!email) return;
      const { data: m } = await supabase
        .from("team_members").select("name, access_level").eq("email", email).maybeSingle();
      setPerfil({
        nome: (m as any)?.name || email.split("@")[0],
        nivel: (m as any)?.access_level === "admin" ? "Administrador"
          : (m as any)?.access_level === "gestor" ? "Gestor" : "Funcionário",
      });
    });
  }, []);

  const sair = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="px-3 py-4 border-t border-border">
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
        <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-white">
          {perfil?.nome?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{perfil?.nome || "..."}</p>
          <p className="text-[10px] text-muted-foreground">{perfil?.nivel || ""}</p>
        </div>
        <button onClick={sair} title="Sair" className="p-1 rounded hover:bg-accent transition-colors">
          <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { user } = useCurrentUser();
  const mods = user?.modules;

  // Mantém só os itens (e subitens) que o usuário pode ver
  const navPermitido = nav
    .map((item) => {
      if (!item.children) return item;
      const filhos = item.children.filter((c: any) => canSee(mods, c.module));
      return filhos.length ? { ...item, children: filhos } : null;
    })
    .filter((item): item is typeof nav[0] =>
      item !== null && (item.children ? true : canSee(mods, (item as any).module))
    );

  return (
    <aside className="w-60 h-screen flex flex-col border-r border-border bg-card shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <img
          src="/brand/logo-yphe.svg"
          alt="YPHE"
          className="h-6 w-auto brightness-0 invert opacity-90"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navPermitido.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}
      </nav>

      {/* User */}
      <UserBox />
    </aside>
  );
}
