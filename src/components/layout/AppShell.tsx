"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2 } from "lucide-react";

/**
 * Envolve o app: exige sessão para navegar e esconde o menu na tela de login.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublico = pathname === "/login" || pathname.startsWith("/portal") || pathname.startsWith("/site");
  const isLogin = isPublico;
  const [status, setStatus] = useState<"carregando" | "dentro" | "fora">("carregando");

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

  if (status !== "dentro") {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
