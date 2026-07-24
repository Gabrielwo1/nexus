"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { TeamMember } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Users, Plus, X, Check, Loader2, Shield, User as UserIcon,
  Mail, Phone, Power, KeyRound, Trash2, Search,
} from "lucide-react";
import { toast } from "sonner";
import { MODULES, MODULE_GROUPS, PRESETS } from "@/lib/modules";

type Usuario = TeamMember & {
  email: string | null;
  access_level: string | null;
  phone: string | null;
  auth_user_id: string | null;
  modules: string[] | null;
};

const FUNCOES = [
  "copywriter", "videomaker", "social_media", "branding", "stories",
  "designer", "trafego", "admin", "outro",
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroAcesso, setFiltroAcesso] = useState("todos");
  const [editando, setEditando] = useState<Usuario | null>(null);

  const vazio = { name: "", email: "", senha: "", role: "social_media", phone: "" };
  const [form, setForm] = useState(vazio);
  const [mods, setMods] = useState<string[]>(["dashboard"]);
  const [acessoTotal, setAcessoTotal] = useState(false);

  const load = () => {
    supabase.from("team_members").select("*").order("status").order("name")
      .then(({ data }) => { setUsuarios((data as any) || []); setLoading(false); });
  };
  useEffect(load, []);

  const filtrados = usuarios.filter(u => {
    if (filtroAcesso === "total" && u.modules !== null) return false;
    if (filtroAcesso === "restrito" && u.modules === null) return false;
    if (filtroAcesso === "sem_login" && u.auth_user_id) return false;
    if (busca && !`${u.name} ${u.email || ""}`.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const salvar = async () => {
    if (!form.name.trim()) { toast.error("Informe o nome"); return; }
    setSaving(true);

    // Edição
    if (editando) {
      const { error } = await supabase.from("team_members").update({
        name: form.name.trim(),
        role: form.role,
        phone: form.phone || null,
        email: form.email || null,
        modules: acessoTotal ? null : mods,
      }).eq("id", editando.id);
      setSaving(false);
      if (error) { toast.error("Erro: " + error.message); return; }
      fechar(); load();
      toast.success("Usuário atualizado");
      return;
    }

    // Criação no servidor (não derruba a sessão de quem está criando)
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email || null,
        senha: form.senha || null,
        role: form.role,
        phone: form.phone || null,
        modules: acessoTotal ? null : mods,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error || "Erro ao criar usuário"); return; }
    fechar(); load();
    toast.success(json.comLogin ? "Usuário criado e já pode entrar no sistema" : "Usuário criado (sem login)");
  };

  const definirSenha = async (u: Usuario) => {
    if (!u.auth_user_id) { toast.error("Usuário sem login criado"); return; }
    const nova = prompt(`Nova senha para ${u.name} (mín. 6 caracteres):`);
    if (!nova) return;
    const res = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_user_id: u.auth_user_id, senha: nova }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Erro ao definir senha"); return; }
    toast.success(`Senha de ${u.name} atualizada`);
  };

  const alternarStatus = async (u: Usuario) => {
    const novo = u.status === "active" ? "inactive" : "active";
    await supabase.from("team_members").update({ status: novo }).eq("id", u.id);
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, status: novo } : x));
    toast.success(novo === "active" ? `${u.name} reativado` : `${u.name} desativado`);
  };

  const resetarSenha = async (u: Usuario) => {
    if (!u.email) { toast.error("Usuário sem e-mail cadastrado"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(u.email);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`E-mail de redefinição enviado para ${u.email}`);
  };

  const abrirEdicao = (u: Usuario) => {
    setEditando(u);
    setForm({
      name: u.name, email: u.email || "", senha: "",
      role: u.role, phone: u.phone || "",
    });
    setAcessoTotal(u.modules === null);
    setMods(u.modules || []);
    setShowForm(true);
  };

  const fechar = () => { setShowForm(false); setEditando(null); setForm(vazio); setMods(["dashboard"]); setAcessoTotal(false); };

  const ativos = usuarios.filter(u => u.status === "active").length;
  const comAcessoTotal = usuarios.filter(u => u.modules === null && u.status === "active").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="brand-header flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-nexus-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-sm text-muted-foreground">
              {ativos} ativos · {comAcessoTotal} com acesso total
            </p>
          </div>
        </div>
        <button onClick={() => { setEditando(null); setForm(vazio); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome ou e-mail..."
            className="bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 w-64" />
        </div>
        <div className="flex gap-1.5">
          {[
            { k: "todos", label: "Todos" },
            { k: "total", label: "Acesso total" },
            { k: "restrito", label: "Acesso restrito" },
            { k: "sem_login", label: "Sem login" },
          ].map(f => (
            <button key={f.k} onClick={() => setFiltroAcesso(f.k)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filtroAcesso === f.k ? "bg-nexus-600/20 text-nexus-300 border border-nexus-500/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="glass rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {editando ? `Editar ${editando.name}` : "Novo Usuário"}
            </h2>
            <button onClick={fechar} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Nome *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Karyne"
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">E-mail (login)</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="nome@yphe.com.br"
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
            {!editando && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Senha inicial</label>
                <input type="text" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} placeholder="mín. 6 caracteres"
                  className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
              </div>
            )}
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Função</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
                {FUNCOES.map(f => <option key={f} value={f}>{f.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Telefone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000"
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
            </div>
          </div>

          {/* Módulos habilitados */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Módulos habilitados</p>
                <p className="text-[11px] text-muted-foreground">Escolha o que este usuário enxerga no menu</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={acessoTotal}
                  onChange={e => setAcessoTotal(e.target.checked)}
                  className="w-4 h-4 rounded accent-nexus-500" />
                <span className="text-xs text-foreground">Acesso total</span>
              </label>
            </div>

            {!acessoTotal && (
              <>
                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Modelos:</span>
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => setMods(p.keys)}
                      className="px-2.5 py-1 rounded-md text-[11px] border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      {p.label}
                    </button>
                  ))}
                  <button onClick={() => setMods([])}
                    className="px-2.5 py-1 rounded-md text-[11px] border border-border text-muted-foreground hover:text-red-400 transition-colors">
                    Limpar
                  </button>
                </div>

                {/* Lista por grupo */}
                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                  {MODULE_GROUPS.map(grupo => {
                    const doGrupo = MODULES.filter(m => m.group === grupo);
                    const todosMarcados = doGrupo.every(m => mods.includes(m.key));
                    return (
                      <div key={grupo}>
                        <button
                          onClick={() => setMods(prev =>
                            todosMarcados
                              ? prev.filter(k => !doGrupo.some(m => m.key === k))
                              : [...new Set([...prev, ...doGrupo.map(m => m.key)])]
                          )}
                          className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 hover:text-nexus-400 transition-colors"
                        >
                          {grupo} {todosMarcados ? "— limpar" : "— marcar todos"}
                        </button>
                        <div className="space-y-1">
                          {doGrupo.map(m => (
                            <label key={m.key} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={mods.includes(m.key)}
                                onChange={e => setMods(prev =>
                                  e.target.checked ? [...prev, m.key] : prev.filter(k => k !== m.key)
                                )}
                                className="w-3.5 h-3.5 rounded accent-nexus-500"
                              />
                              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                {m.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {mods.length} de {MODULES.length} módulos habilitados
                </p>
              </>
            )}
          </div>

          {!editando && (
            <p className="text-[11px] text-muted-foreground">
              Preenchendo e-mail + senha, o usuário já consegue entrar no sistema. Sem isso, ele fica só
              cadastrado como membro da equipe (aparece nas atribuições, mas não faz login).
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={fechar} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={salvar} disabled={saving}
              className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editando ? "Salvar" : "Criar usuário"}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/20">
              {["Usuário", "Contato", "Função", "Módulos", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6}><div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div></td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum usuário encontrado</td></tr>
            ) : filtrados.map(u => {
              const inativo = u.status !== "active";
              return (
                <tr key={u.id} className={cn("hover:bg-accent/20 transition-colors", inativo && "opacity-50")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-white">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        {u.auth_user_id && <p className="text-[10px] text-emerald-400">tem acesso</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {u.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>}
                      {u.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>}
                      {!u.email && !u.phone && <span className="text-xs text-muted-foreground/50">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground capitalize">{u.role.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.modules === null ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-nexus-400/15 text-nexus-300">
                        Acesso total
                      </span>
                    ) : u.modules.length === 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-400/10 text-red-400">
                        Nenhum módulo
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground" title={u.modules.map(k => MODULES.find(m => m.key === k)?.label).filter(Boolean).join(", ")}>
                        {u.modules.length} de {MODULES.length} módulos
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      inativo ? "bg-gray-400/10 text-gray-400" : "bg-emerald-400/10 text-emerald-400")}>
                      {inativo ? "Inativo" : "Ativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirEdicao(u)} title="Editar"
                        className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        Editar
                      </button>
                      {u.auth_user_id && (
                        <button onClick={() => definirSenha(u)} title="Definir nova senha"
                          className="p-1.5 rounded text-muted-foreground hover:text-nexus-400 hover:bg-accent transition-colors">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => alternarStatus(u)} title={inativo ? "Reativar" : "Desativar"}
                        className={cn("p-1.5 rounded transition-colors hover:bg-accent",
                          inativo ? "text-muted-foreground hover:text-emerald-400" : "text-muted-foreground hover:text-red-400")}>
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
