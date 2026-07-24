"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type CurrentUser = {
  email: string;
  nome: string;
  /** null = acesso total */
  modules: string[] | null;
};

/** Carrega o usuário logado e seus módulos habilitados. */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const email = auth.user?.email;
      if (!email) { if (ativo) { setUser(null); setLoading(false); } return; }

      const { data: m } = await supabase
        .from("team_members")
        .select("name, modules")
        .eq("email", email)
        .maybeSingle();

      if (!ativo) return;
      setUser({
        email,
        nome: (m as any)?.name || email.split("@")[0],
        modules: (m as any)?.modules ?? null,
      });
      setLoading(false);
    };

    carregar();
    const { data: sub } = supabase.auth.onAuthStateChange(() => carregar());
    return () => { ativo = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, loading };
}
