"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  DollarSign,
  UserCircle,
  BarChart3,
  LayoutDashboard,
  Palette,
  CalendarDays,
  FolderImage,
  CheckSquare,
  TrendingUp,
  Receipt,
  UserPlus,
  Instagram,
  ChevronDown,
  Zap,
  FileText,
  KanbanSquare,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const nav = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Equipe",
    icon: Users,
    color: "text-violet-400",
    children: [
      { label: "Branding", href: "/equipe/branding", icon: Palette },
      { label: "Calendário & Copys", href: "/equipe/calendario", icon: CalendarDays },
      { label: "Armazenamento de Mídias", href: "/equipe/midias", icon: FolderImage },
      { label: "Mídias para Aprovação", href: "/equipe/aprovacoes", icon: CheckSquare },
    ],
  },
  {
    label: "Financeiro",
    icon: DollarSign,
    color: "text-emerald-400",
    children: [
      { label: "Visão Geral", href: "/financeiro", icon: TrendingUp },
      { label: "Receitas & Gastos", href: "/financeiro/receitas", icon: DollarSign },
      { label: "Cobranças", href: "/financeiro/cobrancas", icon: Receipt },
      { label: "Projeções", href: "/financeiro/projecoes", icon: BarChart3 },
    ],
  },
  {
    label: "CRM",
    icon: UserCircle,
    color: "text-sky-400",
    children: [
      { label: "Clientes", href: "/crm", icon: UserCircle },
      { label: "Adicionar Cliente", href: "/crm/novo", icon: UserPlus },
    ],
  },
  {
    label: "Dados",
    icon: BarChart3,
    color: "text-orange-400",
    children: [
      { label: "Instagram Orgânico", href: "/dados/instagram", icon: Instagram },
      { label: "Performance Geral", href: "/dados", icon: TrendingUp },
    ],
  },
  {
    label: "Contratos",
    href: "/contratos",
    icon: FileText,
  },
  {
    label: "Tarefas",
    href: "/tarefas",
    icon: KanbanSquare,
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
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          active
            ? "bg-nexus-600/20 text-nexus-300 glow"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <item.icon className={cn("w-4 h-4", active && "text-nexus-400")} />
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
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          anyActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <item.icon className={cn("w-4 h-4", item.color)} />
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
                const active = pathname === child.href || pathname.startsWith(child.href + "/");
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-all duration-150",
                      active
                        ? "text-nexus-300 bg-nexus-600/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
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

export function Sidebar() {
  return (
    <aside className="w-60 h-screen flex flex-col border-r border-border bg-card shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">NEXUS</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Impulse Media</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nexus-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
            E
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">Eliab Silva</p>
            <p className="text-[10px] text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
