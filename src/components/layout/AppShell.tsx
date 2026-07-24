"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/Sidebar";
import { canSee, moduleForPath } from "@/lib/modules";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Loader2, Lock } from "lucide-react";

/**
 * Envolve o app: exige sessão para navegar e esconde o menu na tela de login.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const [status, setStatus] = useState<"carregando" | "dentro" | "fora">("carregando");
  const { user, loading: carregandoUser } = useCurrentUser();

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setStatus(data.session ? "dentro" : "fora");
      if (!data.session && !isLogin) router.replace("/login");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!ativo) return;
      setStatus(session ? "dentro" : "fora");
      if (!session && !isLogin) router.replace("/login");
    });

    return () => { ativo = false; sub.subscription.unsubscribe(); };
  }, [isLogin, router]);

  // Tela de login: sem menu, sem guard
  if (isLogin) return <>{children}</>;

  if (status !== "dentro" || carregandoUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Bloqueia rota de módulo não habilitado
  const mod = moduleForPath(pathname);
  const bloqueado = mod ? !canSee(user?.modules, mod.key) : false;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {bloqueado ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Módulo não habilitado</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Você não tem acesso a <span className="text-foreground font-medium">{mod?.label}</span>.
              Peça a um administrador para habilitar em Gestão de Usuários.
            </p>
          </div>
        ) : children}
      </main>
    </div>
  );
}
