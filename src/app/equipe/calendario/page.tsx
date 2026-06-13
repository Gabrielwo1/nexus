"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Client, CalendarPost, TeamMember } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Plus, Loader2, Check, ChevronLeft, ChevronRight,
  Clock, User, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS = ["rascunho", "aprovado", "agendado", "publicado"];
const TIPOS = ["reel", "carrossel", "stories", "feed"];

const statusCor: Record<string, string> = {
  rascunho: "bg-gray-400/10 text-gray-400",
  aprovado: "bg-emerald-400/10 text-emerald-400",
  agendado: "bg-nexus-400/10 text-nexus-300",
  publicado: "bg-violet-400/10 text-violet-300",
};

const tipoCor: Record<string, string> = {
  reel: "bg-nexus-500", carrossel: "bg-violet-500",
  stories: "bg-pink-500", feed: "bg-sky-500",
};

export default function CalendarioPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [form, setForm] = useState({
    client_id: "", title: "", copy: "", caption: "", type: "reel",
    status: "rascunho", scheduled_at: "", assigned_to: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("calendar_posts").select("*, clients(name), team_members(name)").order("scheduled_at"),
      supabase.from("clients").select("id,name").eq("status", "active").order("name"),
      supabase.from("team_members").select("*").eq("status", "active"),
    ]).then(([p, c, t]) => {
      setPosts((p.data as any) || []);
      setClients(c.data || []);
      setTeam(t.data || []);
      setLoading(false);
    });
  }, []);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const postsForDay = (day: Date) =>
    posts.filter((p) => p.scheduled_at && isSameDay(parseISO(p.scheduled_at), day) &&
      (filtroCliente === "todos" || p.client_id === filtroCliente));

  const save = async () => {
    if (!form.client_id || !form.title) { toast.error("Cliente e título obrigatórios"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("calendar_posts")
      .insert({ ...form, scheduled_at: form.scheduled_at || null, assigned_to: form.assigned_to || null })
      .select("*, clients(name), team_members(name)").single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    setPosts((prev) => [...prev, data as any]);
    setShowForm(false);
    setForm({ client_id: "", title: "", copy: "", caption: "", type: "reel", status: "rascunho", scheduled_at: "", assigned_to: "" });
    toast.success("Post adicionado ao calendário");
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("calendar_posts").update({ status }).eq("id", id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    toast.success("Status atualizado");
  };

  const firstDayOfWeek = days[0].getDay();

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendário & Copys</h1>
            <p className="text-sm text-muted-foreground">Planejamento de conteúdo e textos</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Novo Post
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-6 border border-nexus-500/20 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Novo Post</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Cliente *</label>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                <option value="">Selecionar...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                {TIPOS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Responsável</label>
              <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                <option value="">Sem responsável</option>
                {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data de publicação</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Título *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do post" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Copy / Roteiro</label>
              <input value={form.copy} onChange={(e) => setForm({ ...form, copy: e.target.value })} placeholder="Texto do roteiro ou copy..." className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            <div className="col-span-4">
              <label className="block text-xs text-muted-foreground mb-1.5">Legenda (caption)</label>
              <textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Legenda para o Instagram..." rows={2} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
            </button>
          </div>
        </div>
      )}

      {/* Filtro cliente */}
      <div className="flex gap-1.5">
        {[{ id: "todos", name: "Todos" }, ...clients].map((c) => (
          <button key={c.id} onClick={() => setFiltroCliente(c.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filtroCliente === c.id ? "bg-violet-400/20 text-violet-300 border border-violet-400/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Calendário */}
      <div className="glass rounded-xl overflow-hidden flex-1">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-border">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {[...Array(firstDayOfWeek)].map((_, i) => <div key={`empty-${i}`} className="border-r border-b border-border min-h-[80px]" />)}
          {days.map((day) => {
            const dayPosts = postsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={cn("border-r border-b border-border min-h-[80px] p-1.5 cursor-pointer hover:bg-accent/30 transition-colors", isToday && "bg-nexus-600/5")}>
                <p className={cn("text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full", isToday ? "bg-nexus-500 text-white" : "text-muted-foreground")}>
                  {format(day, "d")}
                </p>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className={cn("text-[9px] font-medium text-white px-1 py-0.5 rounded truncate", tipoCor[post.type] || "bg-nexus-500")}>
                      {post.title}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <p className="text-[9px] text-muted-foreground">+{dayPosts.length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de posts */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Todos os posts</h2>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-14 shimmer mx-4 my-2 rounded-lg" />)
          ) : posts.filter(p => filtroCliente === "todos" || p.client_id === filtroCliente).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nenhum post cadastrado</div>
          ) : (
            posts.filter(p => filtroCliente === "todos" || p.client_id === filtroCliente).map((post) => (
              <div key={post.id} className="flex items-center gap-4 px-5 py-3 hover:bg-accent/20 transition-colors">
                <div className={cn("w-1.5 h-10 rounded-full flex-shrink-0", tipoCor[post.type] || "bg-nexus-500")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{(post as any).clients?.name} · {post.type}</p>
                </div>
                {post.scheduled_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(parseISO(post.scheduled_at), "dd/MM HH:mm")}
                  </div>
                )}
                {(post as any).team_members?.name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    {(post as any).team_members.name}
                  </div>
                )}
                <select
                  value={post.status}
                  onChange={(e) => updateStatus(post.id, e.target.value)}
                  className={cn("text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none", statusCor[post.status])}
                >
                  {STATUS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
