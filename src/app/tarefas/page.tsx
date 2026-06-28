"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { TeamMember } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  LayoutGrid, GanttChart, Plus, Loader2, Check, X,
  ChevronLeft, ChevronRight, Circle, AlertCircle, CheckCircle2,
  Clock, User, Tag, Calendar, Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, differenceInDays, startOfWeek, eachDayOfInterval, isToday, parseISO, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

type Task = {
  id: string;
  title: string;
  type: string | null;
  status: string;
  priority: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  color: string | null;
  description: string | null;
  assigned_to: string | null;
  client_id: string | null;
  project_id: string | null;
  created_at: string;
  team_members?: { name: string; role: string };
  clients?: { name: string };
};

const STATUS_COLS = [
  { key: "pending", label: "Pendente", color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20" },
  { key: "in_progress", label: "Em andamento", color: "text-nexus-400", bg: "bg-nexus-400/10", border: "border-nexus-400/20" },
  { key: "review", label: "Em revisão", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  { key: "approved", label: "Aprovado", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { key: "delivered", label: "Entregue", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
];

const PRIORIDADE_COR: Record<string, string> = {
  baixa: "text-gray-400", normal: "text-sky-400",
  alta: "text-orange-400", urgente: "text-red-400",
};

const TIPOS_TAREFA = ["reel", "story", "roteiro", "narrativa", "design", "copy", "aprovacao", "reuniao", "outro"];

const PRIORITY_ICON: Record<string, React.ElementType> = {
  baixa: Circle, normal: Clock, alta: AlertCircle, urgente: AlertCircle,
};

export default function TarefasPage() {
  const [view, setView] = useState<"kanban" | "gantt">("kanban");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterMember, setFilterMember] = useState("todos");
  const [filterPriority, setFilterPriority] = useState("todos");
  const [ganttStart, setGanttStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dragging, setDragging] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const [form, setForm] = useState({
    title: "", type: "reel", status: "pending", priority: "normal",
    start_date: new Date().toISOString().split("T")[0],
    end_date: addDays(new Date(), 5).toISOString().split("T")[0],
    estimated_hours: "", assigned_to: "", client_id: "",
    color: "#6366f1", description: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("tasks").select("*, team_members(name, role), clients(name)").order("start_date", { ascending: true }),
      supabase.from("team_members").select("*").eq("status", "active").order("name"),
      supabase.from("clients").select("id, name").eq("status", "active").order("name"),
    ]).then(([t, m, c]) => {
      setTasks((t.data as any) || []);
      setMembers((m.data as any) || []);
      setClients((c.data as any) || []);
      setLoading(false);
    });
  }, []);

  const filtered = tasks.filter(t => {
    if (filterMember !== "todos" && t.assigned_to !== filterMember) return false;
    if (filterPriority !== "todos" && t.priority !== filterPriority) return false;
    return true;
  });

  const save = async () => {
    if (!form.title) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    const payload = {
      ...form,
      estimated_hours: form.estimated_hours ? parseInt(form.estimated_hours) : null,
      assigned_to: form.assigned_to || null,
      client_id: form.client_id || null,
    };
    const { data, error } = await supabase
      .from("tasks").insert(payload)
      .select("*, team_members(name, role), clients(name)").single();
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setTasks(prev => [...prev, data as any]);
    setShowForm(false);
    setForm({ title: "", type: "reel", status: "pending", priority: "normal", start_date: new Date().toISOString().split("T")[0], end_date: addDays(new Date(), 5).toISOString().split("T")[0], estimated_hours: "", assigned_to: "", client_id: "", color: "#6366f1", description: "" });
    toast.success("Tarefa criada");
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("tasks").update({ status }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setEditingTask(null);
    toast.success("Tarefa removida");
  };

  const startEdit = (t: Task) => {
    setEditForm({
      title: t.title, type: t.type || "reel", priority: t.priority || "normal",
      assigned_to: t.assigned_to || "", client_id: t.client_id || "",
      start_date: t.start_date || "", end_date: t.end_date || "",
      estimated_hours: t.estimated_hours?.toString() || "",
      color: t.color || "#6366f1", description: t.description || "",
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!editingTask) return;
    if (!editForm.title) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    const payload = {
      title: editForm.title, type: editForm.type, priority: editForm.priority,
      assigned_to: editForm.assigned_to || null, client_id: editForm.client_id || null,
      start_date: editForm.start_date || null, end_date: editForm.end_date || null,
      estimated_hours: editForm.estimated_hours ? parseInt(editForm.estimated_hours) : null,
      color: editForm.color, description: editForm.description || null,
    };
    const { data, error } = await supabase
      .from("tasks").update(payload).eq("id", editingTask.id)
      .select("*, team_members(name, role), clients(name)").single();
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setTasksAfterEdit(data as any);
    setEditingTask(data as any);
    setEditMode(false);
    toast.success("Tarefa atualizada");
  };

  const setTasksAfterEdit = (updated: Task) =>
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));

  // Gantt: 30 dias visíveis
  const ganttDays = eachDayOfInterval({ start: ganttStart, end: addDays(ganttStart, 29) });
  const GANTT_DAY_W = 36;
  const GANTT_LABEL_W = 200;

  const getBarProps = (task: Task) => {
    if (!task.start_date || !task.end_date) return null;
    const start = parseISO(task.start_date);
    const end = parseISO(task.end_date);
    const ganttEnd = addDays(ganttStart, 29);
    const clampedStart = isBefore(start, ganttStart) ? ganttStart : start;
    const clampedEnd = isAfter(end, ganttEnd) ? ganttEnd : end;
    if (isAfter(clampedStart, ganttEnd) || isBefore(clampedEnd, ganttStart)) return null;
    const offsetDays = differenceInDays(clampedStart, ganttStart);
    const durationDays = differenceInDays(clampedEnd, clampedStart) + 1;
    return { left: offsetDays * GANTT_DAY_W, width: durationDays * GANTT_DAY_W - 2 };
  };

  const tasksWithDates = filtered.filter(t => t.start_date && t.end_date);
  const tasksWithoutDates = filtered.filter(t => !t.start_date || !t.end_date);

  // Kanban columns
  const getCol = (status: string) => filtered.filter(t => t.status === status);
  const totalByStatus = STATUS_COLS.map(s => ({ ...s, count: getCol(s.key).length }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <GanttChart className="w-5 h-5 text-nexus-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} tarefas · {filtered.filter(t => t.status === "in_progress").length} em andamento</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex gap-1 border border-border rounded-lg p-0.5">
            <button onClick={() => setView("kanban")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all", view === "kanban" ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground")}>
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button onClick={() => setView("gantt")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all", view === "gantt" ? "bg-nexus-600 text-white" : "text-muted-foreground hover:text-foreground")}>
              <GanttChart className="w-3.5 h-3.5" /> Gantt
            </button>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mx-8 mb-4 glass rounded-xl p-5 border border-nexus-500/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Nova Tarefa</h2>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-accent transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Título *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Editar reel Dr. Mussi" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                {TIPOS_TAREFA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Prioridade</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Responsável</label>
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                <option value="">Sem responsável</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Cliente</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                <option value="">Sem cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Início</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Prazo</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Horas estimadas</label>
              <input type="number" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} placeholder="8" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Cor no Gantt</label>
              <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-9 rounded-lg border border-border cursor-pointer bg-transparent" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Descrição</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalhes da tarefa..." className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Criar Tarefa
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 px-8 pb-4 flex-shrink-0">
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
          <option value="todos">Todos os membros</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <div className="flex gap-1.5">
          {["todos", "baixa", "normal", "alta", "urgente"].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all", filterPriority === p ? "bg-nexus-600/20 text-nexus-300 border border-nexus-500/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
              {p === "todos" ? "Todas prioridades" : p}
            </button>
          ))}
        </div>
        {/* Status summary */}
        <div className="ml-auto flex gap-3">
          {totalByStatus.filter(s => s.count > 0).map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", s.bg.replace("/10", "").replace("bg-", "bg-"))} style={{ background: s.key === "pending" ? "#6b7280" : s.key === "in_progress" ? "#6366f1" : s.key === "review" ? "#f97316" : s.key === "approved" ? "#34d399" : "#a78bfa" }} />
              <span className="text-xs text-muted-foreground">{s.label}: <span className="font-medium text-foreground">{s.count}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== KANBAN ===== */}
      {view === "kanban" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
          <div className="flex gap-4 h-full min-w-max">
            {STATUS_COLS.map(col => {
              const colTasks = getCol(col.key);
              return (
                <div key={col.key} className={cn("flex flex-col w-72 rounded-xl border", col.border, "bg-card/40")}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragging) updateStatus(dragging, col.key);
                    setDragging(null);
                  }}
                >
                  {/* Col header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", col.color.replace("text-", "bg-"))} style={{ background: col.key === "pending" ? "#6b7280" : col.key === "in_progress" ? "#6366f1" : col.key === "review" ? "#f97316" : col.key === "approved" ? "#34d399" : "#a78bfa" }} />
                      <span className="text-xs font-semibold text-foreground">{col.label}</span>
                    </div>
                    <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", col.bg, col.color)}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {colTasks.map(task => {
                      const PrioIcon = PRIORITY_ICON[task.priority || "normal"] || Clock;
                      const isOverdue = task.end_date && isBefore(parseISO(task.end_date), new Date()) && task.status !== "delivered" && task.status !== "approved";
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => setDragging(task.id)}
                          onDragEnd={() => setDragging(null)}
                          onClick={() => setEditingTask(task)}
                          className={cn(
                            "glass rounded-xl p-3.5 cursor-pointer hover:border-nexus-500/30 border border-transparent transition-all group",
                            dragging === task.id && "opacity-50",
                            isOverdue && "border-red-500/20"
                          )}
                        >
                          {/* Color bar */}
                          <div className="w-full h-0.5 rounded-full mb-3" style={{ background: task.color || "#6366f1" }} />

                          <p className="text-sm font-medium text-foreground mb-1.5 line-clamp-2">{task.title}</p>

                          {task.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{task.description}</p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {task.type && (
                              <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded-full text-muted-foreground capitalize">{task.type}</span>
                            )}
                            {task.clients?.name && (
                              <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded-full text-muted-foreground">{task.clients.name}</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {task.team_members?.name && (
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white">
                                  {task.team_members.name[0]}
                                </div>
                              )}
                              <PrioIcon className={cn("w-3 h-3", PRIORIDADE_COR[task.priority || "normal"])} />
                            </div>
                            {task.end_date && (
                              <span className={cn("text-[10px] flex items-center gap-1", isOverdue ? "text-red-400" : "text-muted-foreground")}>
                                <Calendar className="w-2.5 h-2.5" />
                                {format(parseISO(task.end_date), "dd/MM")}
                              </span>
                            )}
                          </div>

                          {task.estimated_hours && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="w-2.5 h-2.5" /> {task.estimated_hours}h estimadas
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="h-20 flex items-center justify-center rounded-lg border border-dashed border-border">
                        <p className="text-xs text-muted-foreground">Sem tarefas</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== GANTT ===== */}
      {view === "gantt" && (
        <div className="flex-1 overflow-hidden flex flex-col px-8 pb-8">
          {/* Gantt controls */}
          <div className="flex items-center gap-3 mb-3 flex-shrink-0">
            <button onClick={() => setGanttStart(d => addDays(d, -7))} className="p-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {format(ganttStart, "dd MMM", { locale: ptBR })} — {format(addDays(ganttStart, 29), "dd MMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={() => setGanttStart(d => addDays(d, 7))} className="p-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setGanttStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs text-nexus-400 hover:underline ml-1">
              Hoje
            </button>
          </div>

          <div className="flex-1 glass rounded-xl overflow-auto">
            {/* Header: dias */}
            <div className="flex border-b border-border sticky top-0 bg-card z-10 flex-shrink-0">
              <div className="flex-shrink-0 bg-card" style={{ width: GANTT_LABEL_W, minWidth: GANTT_LABEL_W }}>
                <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarefa</div>
              </div>
              <div className="flex">
                {ganttDays.map(day => (
                  <div
                    key={day.toISOString()}
                    style={{ width: GANTT_DAY_W, minWidth: GANTT_DAY_W }}
                    className={cn(
                      "flex flex-col items-center py-2 border-l border-border/30 text-center",
                      isToday(day) && "bg-nexus-600/10"
                    )}
                  >
                    <span className={cn("text-[9px] font-medium uppercase", isToday(day) ? "text-nexus-400" : "text-muted-foreground")}>
                      {format(day, "EEE", { locale: ptBR }).slice(0, 3)}
                    </span>
                    <span className={cn("text-[11px] font-semibold", isToday(day) ? "text-nexus-300 bg-nexus-500 w-5 h-5 rounded-full flex items-center justify-center" : "text-foreground")}>
                      {format(day, "d")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div>
              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : tasksWithDates.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  Adicione tarefas com datas de início e fim para visualizar no Gantt
                </div>
              ) : tasksWithDates.map((task, idx) => {
                const bar = getBarProps(task);
                const isOverdue = task.end_date && isBefore(parseISO(task.end_date), new Date()) && task.status !== "delivered" && task.status !== "approved";
                const PrioIcon = PRIORITY_ICON[task.priority || "normal"] || Clock;
                return (
                  <div key={task.id} className={cn("flex border-b border-border/20 hover:bg-accent/10 transition-colors", idx % 2 === 0 ? "" : "bg-accent/5")}>
                    {/* Label */}
                    <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5" style={{ width: GANTT_LABEL_W, minWidth: GANTT_LABEL_W }}>
                      {task.team_members?.name && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-nexus-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {task.team_members.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate max-w-[130px]">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PrioIcon className={cn("w-2.5 h-2.5 flex-shrink-0", PRIORIDADE_COR[task.priority || "normal"])} />
                          {task.type && <span className="text-[9px] text-muted-foreground capitalize">{task.type}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Bar area */}
                    <div className="relative flex" style={{ minHeight: 44 }}>
                      {/* Grid lines */}
                      {ganttDays.map(day => (
                        <div
                          key={day.toISOString()}
                          style={{ width: GANTT_DAY_W, minWidth: GANTT_DAY_W }}
                          className={cn("border-l border-border/20 flex-shrink-0", isToday(day) && "bg-nexus-600/5")}
                        />
                      ))}

                      {/* Bar */}
                      {bar && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-2 cursor-pointer hover:brightness-110 transition-all"
                          style={{
                            left: bar.left,
                            width: Math.max(bar.width, GANTT_DAY_W - 2),
                            height: 28,
                            background: task.color || "#6366f1",
                            opacity: task.status === "delivered" ? 0.5 : 1,
                          }}
                          onClick={() => setEditingTask(task)}
                          title={task.title}
                        >
                          <span className="text-[10px] font-medium text-white truncate">
                            {task.title}
                          </span>
                          {isOverdue && <AlertCircle className="w-3 h-3 text-white ml-auto flex-shrink-0" />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Tasks sem datas */}
              {tasksWithoutDates.length > 0 && (
                <div className="px-4 py-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1.5">Sem datas definidas ({tasksWithoutDates.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {tasksWithoutDates.map(t => (
                      <span key={t.id} onClick={() => setEditingTask(t)} className="text-xs bg-accent px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                        {t.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhe da tarefa */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setEditingTask(null); setEditMode(false); }}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: editingTask.color || "#6366f1" }} />
                <h2 className="text-base font-semibold text-foreground">{editMode ? "Editar tarefa" : editingTask.title}</h2>
              </div>
              <div className="flex items-center gap-1">
                {!editMode && (
                  <button onClick={() => startEdit(editingTask)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-nexus-300 hover:bg-nexus-600/10 border border-nexus-500/30 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                )}
                <button onClick={() => { setEditingTask(null); setEditMode(false); }} className="p-1 rounded hover:bg-accent transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {editMode ? (
              /* ===== MODO EDIÇÃO ===== */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Título *</label>
                  <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
                    <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                      {TIPOS_TAREFA.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Prioridade</label>
                    <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                      <option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Responsável</label>
                    <select value={editForm.assigned_to} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                      <option value="">Sem responsável</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Cliente</label>
                    <select value={editForm.client_id} onChange={e => setEditForm({ ...editForm, client_id: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                      <option value="">Sem cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Início</label>
                    <input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Prazo</label>
                    <input type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Horas estimadas</label>
                    <input type="number" value={editForm.estimated_hours} onChange={e => setEditForm({ ...editForm, estimated_hours: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Cor</label>
                    <input type="color" value={editForm.color} onChange={e => setEditForm({ ...editForm, color: e.target.value })} className="w-full h-9 rounded-lg border border-border cursor-pointer bg-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Descrição</label>
                  <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none" />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
                  <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
                  </button>
                </div>
              </div>
            ) : (
              /* ===== MODO VISUALIZAÇÃO ===== */
              <>
                {editingTask.description && (
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{editingTask.description}</p>
                )}

                <div className="space-y-2.5 mb-4">
                  {[
                    { label: "Responsável", value: editingTask.team_members?.name || "—" },
                    { label: "Cliente", value: editingTask.clients?.name || "—" },
                    { label: "Tipo", value: editingTask.type || "—" },
                    { label: "Prioridade", value: editingTask.priority || "normal" },
                    { label: "Horas estimadas", value: editingTask.estimated_hours ? `${editingTask.estimated_hours}h` : "—" },
                    { label: "Início", value: editingTask.start_date ? format(parseISO(editingTask.start_date), "dd/MM/yyyy") : "—" },
                    { label: "Prazo", value: editingTask.end_date ? format(parseISO(editingTask.end_date), "dd/MM/yyyy") : "—" },
                  ].map(d => (
                    <div key={d.label} className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-xs text-muted-foreground">{d.label}</span>
                      <span className="text-xs text-foreground font-medium capitalize">{d.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STATUS_COLS.map(s => (
                      <button
                        key={s.key}
                        onClick={() => { updateStatus(editingTask.id, s.key); setEditingTask({ ...editingTask, status: s.key }); toast.success("Status atualizado"); }}
                        className={cn("py-1.5 px-2 rounded-lg text-xs font-medium transition-all", editingTask.status === s.key ? `${s.bg} ${s.color} border ${s.border}` : "text-muted-foreground hover:bg-accent border border-transparent")}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(editingTask.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                >
                  <X className="w-4 h-4" /> Remover tarefa
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
