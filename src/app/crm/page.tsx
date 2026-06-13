"use client";

import { useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Plus,
  UserCircle,
  DollarSign,
  TrendingUp,
  MoreVertical,
  Phone,
  Mail,
  Instagram,
  CheckCircle2,
  PauseCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const clientes = [
  {
    id: "1",
    nome: "Dr. Mussi",
    tipo: "doctor",
    especialidade: "Dermatologista",
    status: "active",
    mensalidade: 4500,
    inicio_contrato: "2025-01-15",
    instagram: "@drmussi",
    projetos_ativos: 2,
    midias_mes: 18,
    inadimplente: false,
  },
  {
    id: "2",
    nome: "Clínica Vita",
    tipo: "clinic",
    especialidade: "Estética e Bem-estar",
    status: "active",
    mensalidade: 6200,
    inicio_contrato: "2024-08-01",
    instagram: "@clinicavita",
    projetos_ativos: 3,
    midias_mes: 24,
    inadimplente: false,
  },
  {
    id: "3",
    nome: "Dr. Costa",
    tipo: "doctor",
    especialidade: "Ortopedista",
    status: "active",
    mensalidade: 3500,
    inicio_contrato: "2025-03-10",
    instagram: "@drcosta_ortopedia",
    projetos_ativos: 1,
    midias_mes: 12,
    inadimplente: true,
  },
  {
    id: "4",
    nome: "Instituto Mussi",
    tipo: "clinic",
    especialidade: "Saúde Integrada",
    status: "active",
    mensalidade: 7800,
    inicio_contrato: "2024-05-20",
    instagram: "@institutomussi",
    projetos_ativos: 4,
    midias_mes: 32,
    inadimplente: false,
  },
  {
    id: "5",
    nome: "Clínica Zen",
    tipo: "clinic",
    especialidade: "Bem-estar e Meditação",
    status: "paused",
    mensalidade: 2800,
    inicio_contrato: "2025-02-01",
    instagram: "@clinicazen",
    projetos_ativos: 0,
    midias_mes: 0,
    inadimplente: false,
  },
];

const statusMap = {
  active: { label: "Ativo", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10" },
  paused: { label: "Pausado", icon: PauseCircle, color: "text-orange-400 bg-orange-400/10" },
  churned: { label: "Encerrado", icon: XCircle, color: "text-red-400 bg-red-400/10" },
};

const tipoMap = {
  doctor: "Médico",
  clinic: "Clínica",
  brand: "Marca",
};

export default function CRMPage() {
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const filtrados = clientes.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.especialidade.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    return matchSearch && matchStatus;
  });

  const totalMRR = clientes
    .filter((c) => c.status === "active")
    .reduce((acc, c) => acc + c.mensalidade, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM — Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clientes.filter((c) => c.status === "active").length} ativos ·{" "}
            MRR: <span className="text-emerald-400 font-medium">{formatCurrency(totalMRR)}</span>
          </p>
        </div>
        <Link
          href="/crm/novo"
          className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
            placeholder="Buscar cliente..."
          />
        </div>
        <div className="flex gap-1.5">
          {["todos", "active", "paused", "churned"].map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize",
                filtroStatus === s
                  ? "bg-nexus-600/20 text-nexus-300 border border-nexus-500/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              {s === "todos" ? "Todos" : s === "active" ? "Ativos" : s === "paused" ? "Pausados" : "Encerrados"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtrados.map((cliente) => {
          const status = statusMap[cliente.status as keyof typeof statusMap];
          return (
            <Link
              key={cliente.id}
              href={`/crm/${cliente.id}`}
              className="glass rounded-xl p-5 hover:border-nexus-500/30 border border-transparent transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                    {cliente.nome[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{cliente.nome}</p>
                      {cliente.inadimplente && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-400/10 text-red-400 font-medium">
                          Atrasado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{cliente.especialidade}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Mensalidade</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatCurrency(cliente.mensalidade)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <span className="text-xs text-foreground">{tipoMap[cliente.tipo as keyof typeof tipoMap]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Mídias/mês</span>
                  <span className="text-xs text-foreground">{cliente.midias_mes}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{cliente.instagram}</span>
                </div>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", status.color)}>
                  {status.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
