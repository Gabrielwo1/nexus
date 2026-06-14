"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Client, BrandingAsset } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import {
  Palette, Plus, Upload, Link2, Type, Image as ImageIcon,
  Trash2, ChevronDown, Loader2, Check,
} from "lucide-react";
import { toast } from "sonner";

const TIPOS = ["logo", "cor", "fonte", "guideline", "template"];

const tipoIcon: Record<string, React.ElementType> = {
  logo: ImageIcon, cor: Palette, fonte: Type,
  guideline: Link2, template: ImageIcon,
};

const tipoCor: Record<string, string> = {
  logo: "text-nexus-400 bg-nexus-400/10",
  cor: "text-pink-400 bg-pink-400/10",
  fonte: "text-sky-400 bg-sky-400/10",
  guideline: "text-emerald-400 bg-emerald-400/10",
  template: "text-orange-400 bg-orange-400/10",
};

export default function BrandingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [assets, setAssets] = useState<BrandingAsset[]>([]);
  const [clienteFiltro, setClienteFiltro] = useState<string>("todos");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "", type: "logo", name: "", file_url: "", hex_color: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("id,name").eq("status", "active").order("name"),
      supabase.from("branding_assets").select("*, clients(name)").order("created_at", { ascending: false }),
    ]).then(([c, a]) => {
      setClients((c.data as any) || []);
      setAssets((a.data as any) || []);
      setLoading(false);
    });
  }, []);

  const filtered = assets.filter((a) => {
    if (clienteFiltro !== "todos" && a.client_id !== clienteFiltro) return false;
    if (tipoFiltro !== "todos" && a.type !== tipoFiltro) return false;
    return true;
  });

  const save = async () => {
    if (!form.client_id || !form.name) {
      toast.error("Cliente e nome são obrigatórios");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("branding_assets").insert(form).select("*, clients(name)").single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    setAssets((prev) => [data as any, ...prev]);
    setShowForm(false);
    setForm({ client_id: "", type: "logo", name: "", file_url: "", hex_color: "", notes: "" });
    toast.success("Asset salvo com sucesso");
  };

  const remove = async (id: string) => {
    await supabase.from("branding_assets").delete().eq("id", id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success("Removido");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Branding</h1>
            <p className="text-sm text-muted-foreground">Logos, cores, fontes e guidelines dos clientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Asset
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-6 border border-nexus-500/20 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Adicionar Asset de Branding</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Cliente *</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
              >
                <option value="">Selecionar...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
              >
                {TIPOS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Nome *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Logo principal"
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">URL do arquivo</label>
              <input
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
              />
            </div>
            {form.type === "cor" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Cor (hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.hex_color || "#6366f1"}
                    onChange={(e) => setForm({ ...form, hex_color: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    value={form.hex_color}
                    onChange={(e) => setForm({ ...form, hex_color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1 bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Notas</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observações..."
                className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5">
          <button onClick={() => setClienteFiltro("todos")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", clienteFiltro === "todos" ? "bg-nexus-600/20 text-nexus-300 border border-nexus-500/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
            Todos clientes
          </button>
          {clients.map((c) => (
            <button key={c.id} onClick={() => setClienteFiltro(c.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", clienteFiltro === c.id ? "bg-nexus-600/20 text-nexus-300 border border-nexus-500/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex gap-1.5">
          {["todos", ...TIPOS].map((t) => (
            <button key={t} onClick={() => setTipoFiltro(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all", tipoFiltro === t ? "bg-pink-400/20 text-pink-300 border border-pink-400/30" : "text-muted-foreground hover:text-foreground border border-transparent")}>
              {t === "todos" ? "Todos tipos" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-36 rounded-xl shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Palette className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Nenhum asset encontrado</p>
          <button onClick={() => setShowForm(true)} className="text-xs text-nexus-400 hover:underline">
            Adicionar primeiro asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((asset) => {
            const Icon = tipoIcon[asset.type] || ImageIcon;
            return (
              <div key={asset.id} className="glass rounded-xl p-4 group hover:border-nexus-500/30 border border-transparent transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", tipoCor[asset.type] || "text-muted-foreground bg-accent")}>
                    {asset.type === "cor" && asset.hex_color ? (
                      <div className="w-5 h-5 rounded-full border border-white/20" style={{ background: asset.hex_color }} />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <button onClick={() => remove(asset.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-400/10 text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-medium text-foreground mb-0.5">{asset.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{(asset as any).clients?.name}</p>
                <div className="flex items-center justify-between">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", tipoCor[asset.type] || "text-muted-foreground bg-accent")}>
                    {asset.type}
                  </span>
                  {asset.hex_color && (
                    <span className="text-[10px] font-mono text-muted-foreground">{asset.hex_color}</span>
                  )}
                </div>
                {asset.file_url && (
                  <a href={asset.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-[10px] text-nexus-400 hover:underline">
                    <Link2 className="w-3 h-3" /> Ver arquivo
                  </a>
                )}
                {asset.notes && <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{asset.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
