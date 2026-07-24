"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getManterConectado, setManterConectado } from "@/lib/supabase";
import { Loader2, LogIn, AlertCircle } from "lucide-react";

const EMAIL_KEY = "nexus.ultimo-email";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [checando, setChecando] = useState(true);
  const [manterConectado, setManter] = useState(true);

  // Se já estiver logado, entra direto; senão restaura o e-mail lembrado
  useEffect(() => {
    setManter(getManterConectado());
    const lembrado = typeof window !== "undefined" ? localStorage.getItem(EMAIL_KEY) : null;
    if (lembrado) setEmail(lembrado);

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
      else setChecando(false);
    });
  }, [router]);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    // define onde a sessão será guardada ANTES de logar
    setManterConectado(manterConectado);

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setLoading(false);
    if (error) {
      setErro(
        error.message.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : error.message.includes("Email not confirmed")
          ? "E-mail ainda não confirmado. Peça a um administrador para liberar seu acesso."
          : error.message
      );
      return;
    }

    // lembra o e-mail para o próximo acesso
    if (manterConectado) localStorage.setItem(EMAIL_KEY, email.trim());
    else localStorage.removeItem(EMAIL_KEY);

    router.replace("/");
  };

  if (checando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado da marca */}
      <div
        className="hidden lg:flex flex-1 relative items-center justify-center p-12"
        style={{
          backgroundImage: "url(/brand/degrade-hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-background/55" />
        <div className="relative z-10 max-w-md">
          <img src="/brand/logo-yphe.svg" alt="YPHE" className="h-9 w-auto brightness-0 invert mb-8" />
          <h2 className="text-3xl font-bold text-white leading-tight">
            O sistema que organiza<br />a produção da agência.
          </h2>
          <p className="text-white/70 mt-4 text-sm leading-relaxed">
            Calendário editorial, pipeline de conteúdo, aprovações e financeiro —
            tudo em um lugar só.
          </p>
        </div>
      </div>

      {/* Lado do formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <img src="/brand/logo-yphe.svg" alt="YPHE" className="h-7 w-auto brightness-0 invert" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-8">
            Acesse com suas credenciais da agência.
          </p>

          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="voce@yphe.com.br" autoComplete="email"
                className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Senha</label>
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)} required
                placeholder="••••••••" autoComplete="current-password"
                className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nexus-500"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={manterConectado}
                onChange={e => setManter(e.target.checked)}
                className="w-4 h-4 rounded accent-nexus-500"
              />
              <span className="text-xs text-foreground">Manter conectado neste dispositivo</span>
            </label>

            {erro && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{erro}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-nexus-600 hover:bg-nexus-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Entrar
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground mt-8">
            {manterConectado
              ? "Sua sessão fica salva neste dispositivo até você sair."
              : "Sua sessão será encerrada ao fechar o navegador."}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Não tem acesso? Peça para um administrador criar seu usuário em Gestão de Usuários.
          </p>
        </div>
      </div>
    </div>
  );
}
