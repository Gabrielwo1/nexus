"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { UserPlus, Loader2, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const TIPOS = ["doctor", "clinic", "brand"];
const TIPOS_LABEL: Record<string, string> = { doctor: "Médico", clinic: "Clínica", brand: "Marca" };

export default function NovoClientePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "doctor", specialty: "", status: "active",
    monthly_fee: "", contract_start: "", instagram_handle: "",
    telegram_chat_id: "", google_ads_account_id: "", notes: "",
  });

  const save = async () => {
    if (!form.name) { toast.error("Nome do cliente é obrigatório"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("clients").insert({
      ...form,
      monthly_fee: parseFloat(form.monthly_fee) || 0,
      contract_start: form.contract_start || null,
      telegram_chat_id: form.telegram_chat_id || null,
      google_ads_account_id: form.google_ads_account_id || null,
    }).select().single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Cliente criado com sucesso!");
    router.push(`/crm/${data.id}`);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/crm" className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados do cliente</p>
        </div>
      </div>

      <div className="glass rounded-xl p-6 space-y-5">
        {/* Tipo */}
        <div>
          <label className="block text-xs text-muted-foreground mb-2">Tipo de cliente</label>
          <div className="flex gap-2">
            {TIPOS.map(t => (
              <button
                key={t}
                onClick={() => setForm({ ...form, type: t })}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all", form.type === t ? "bg-nexus-600/20 border-nexus-500/50 text-nexus-300" : "border-border text-muted-foreground hover:text-foreground")}
              >
                {TIPOS_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">Nome *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Dr. João Silva / Clínica Saúde Total" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Especialidade</label>
            <input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Dermatologista" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Mensalidade (R$)</label>
            <input type="number" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value })} placeholder="4500" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Início do contrato</label>
            <input type="date" value={form.contract_start} onChange={e => setForm({ ...form, contract_start: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Instagram</label>
            <input value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} placeholder="@perfil" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Google Ads Account ID</label>
            <input value={form.google_ads_account_id} onChange={e => setForm({ ...form, google_ads_account_id: e.target.value })} placeholder="000-000-0000" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Telegram Chat ID</label>
            <input value={form.telegram_chat_id} onChange={e => setForm({ ...form, telegram_chat_id: e.target.value })} placeholder="Ex: 123456789" className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500">
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="churned">Encerrado</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">Notas internas</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observações sobre o cliente, preferências, etc..." rows={3} className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/crm" className="px-4 py-2.5 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">
            Cancelar
          </Link>
          <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Criar Cliente
          </button>
        </div>
      </div>
    </div>
  );
}
