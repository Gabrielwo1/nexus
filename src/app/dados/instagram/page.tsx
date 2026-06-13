"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Instagram,
  Heart,
  MessageCircle,
  Users,
  TrendingUp,
  Eye,
  Share2,
  Plus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const clientes = ["Todos", "Dr. Mussi", "Clínica Vita", "Dr. Costa", "Instituto Mussi"];

const metricas = [
  { label: "Seguidores Totais", value: "48.2K", change: "+1.4K", up: true, icon: Users, color: "text-sky-400", bg: "bg-sky-400/10" },
  { label: "Alcance Médio", value: "12.8K", change: "+18%", up: true, icon: Eye, color: "text-violet-400", bg: "bg-violet-400/10" },
  { label: "Engajamento Médio", value: "4.2%", change: "+0.3%", up: true, icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
  { label: "Saves / Shares", value: "892", change: "+34%", up: true, icon: Share2, color: "text-nexus-400", bg: "bg-nexus-400/10" },
];

const crescimentoData = [
  { semana: "S1", mussi: 12400, vita: 8900, costa: 5600 },
  { semana: "S2", mussi: 12800, vita: 9200, costa: 5750 },
  { semana: "S3", mussi: 13100, vita: 9400, costa: 5800 },
  { semana: "S4", mussi: 13500, vita: 9800, costa: 5950 },
  { semana: "S5", mussi: 14200, vita: 10100, costa: 6100 },
  { semana: "S6", mussi: 14800, vita: 10400, costa: 6250 },
];

const engajamentoData = [
  { tipo: "Reels", taxa: 6.2, alcance: 22000 },
  { tipo: "Carrossel", taxa: 4.8, alcance: 15000 },
  { tipo: "Stories", taxa: 3.1, alcance: 18000 },
  { tipo: "Feed", taxa: 2.4, alcance: 9000 },
];

const postsMelhores = [
  { titulo: "Antes e depois - Dr. Mussi", tipo: "reel", likes: 1842, comments: 94, saves: 312, alcance: 28000, data: "08/06" },
  { titulo: "Rotina de skincare - Clínica Vita", tipo: "carrossel", likes: 1230, comments: 67, saves: 245, alcance: 19000, data: "05/06" },
  { titulo: "Dúvidas sobre ortopedia - Dr. Costa", tipo: "reel", likes: 984, comments: 128, saves: 189, alcance: 16500, data: "03/06" },
  { titulo: "Procedimento estético - Vita", tipo: "reel", likes: 876, comments: 45, saves: 167, alcance: 14200, data: "01/06" },
];

const [inputData] = [
  {
    cliente: "Dr. Mussi",
    semana: "Semana 1 - Junho",
    seguidores: 14800,
    seguidores_novos: 380,
    alcance: 28000,
    impressoes: 45000,
    likes: 1842,
    comentarios: 94,
    saves: 312,
    shares: 89,
  },
];

export default function InstagramPage() {
  const [clienteFiltro, setClienteFiltro] = useState("Todos");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Instagram className="w-5 h-5 text-pink-400" />
            <h1 className="text-2xl font-bold text-foreground">Instagram Orgânico</h1>
          </div>
          <p className="text-sm text-muted-foreground">Performance orgânica dos clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Dados
        </button>
      </div>

      {/* Form de entrada de dados */}
      {showForm && (
        <div className="glass rounded-xl p-6 border border-nexus-500/20">
          <h2 className="text-sm font-semibold text-foreground mb-4">Registrar Dados da Semana</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Cliente", type: "select", options: clientes.slice(1) },
              { label: "Semana", type: "text", placeholder: "Ex: Semana 2 - Junho" },
              { label: "Seguidores totais", type: "number", placeholder: "14800" },
              { label: "Novos seguidores", type: "number", placeholder: "380" },
              { label: "Alcance", type: "number", placeholder: "28000" },
              { label: "Impressões", type: "number", placeholder: "45000" },
              { label: "Likes", type: "number", placeholder: "1842" },
              { label: "Comentários", type: "number", placeholder: "94" },
              { label: "Saves", type: "number", placeholder: "312" },
              { label: "Compartilhamentos", type: "number", placeholder: "89" },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-xs text-muted-foreground mb-1.5">{field.label}</label>
                {field.type === "select" ? (
                  <select className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                    {field.options?.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
              Cancelar
            </button>
            <button className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors">
              Salvar Dados
            </button>
          </div>
        </div>
      )}

      {/* Filtro por cliente */}
      <div className="flex gap-2">
        {clientes.map((c) => (
          <button
            key={c}
            onClick={() => setClienteFiltro(c)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              clienteFiltro === c
                ? "bg-pink-400/20 text-pink-300 border border-pink-400/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {metricas.map((m) => (
          <div key={m.label} className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{m.label}</p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", m.bg)}>
                <m.icon className={cn("w-4 h-4", m.color)} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {m.up ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-red-400" />}
                <span className={cn("text-xs", m.up ? "text-emerald-400" : "text-red-400")}>{m.change} esta semana</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Crescimento de Seguidores</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={crescimentoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis dataKey="semana" tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
              <Tooltip contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="mussi" stroke="#6366f1" strokeWidth={2} dot={false} name="Dr. Mussi" />
              <Line type="monotone" dataKey="vita" stroke="#ec4899" strokeWidth={2} dot={false} name="Clínica Vita" />
              <Line type="monotone" dataKey="costa" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Dr. Costa" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Taxa de Engajamento por Formato</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={engajamentoData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="tipo" type="category" tick={{ fill: "hsl(215 20.2% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: "hsl(224 71% 6%)", border: "1px solid hsl(216 34% 17%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`${v}%`, "Engajamento"]} />
              <Bar dataKey="taxa" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Melhores posts */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Melhores Posts — Junho</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/20">
              {["Post", "Tipo", "Alcance", "Likes", "Coments", "Saves", "Data"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {postsMelhores.map((p, i) => (
              <tr key={i} className="hover:bg-accent/20 transition-colors">
                <td className="px-5 py-3.5 text-sm text-foreground font-medium">{p.titulo}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                    p.tipo === "reel" ? "bg-nexus-400/10 text-nexus-300" : "bg-violet-400/10 text-violet-300"
                  )}>{p.tipo}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-foreground">{p.alcance.toLocaleString("pt-BR")}</td>
                <td className="px-5 py-3.5 text-sm text-foreground">{p.likes.toLocaleString("pt-BR")}</td>
                <td className="px-5 py-3.5 text-sm text-foreground">{p.comments}</td>
                <td className="px-5 py-3.5 text-sm text-emerald-400 font-medium">{p.saves}</td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">{p.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
