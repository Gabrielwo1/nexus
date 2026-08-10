import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Diagnóstico temporário: mostra QUAIS variáveis existem, nunca os valores. */
export async function GET() {
  const chaves = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
  const status: Record<string, string> = {};
  chaves.forEach(k => {
    const v = process.env[k];
    status[k] = !v ? "AUSENTE" : `ok (${v.length} caracteres${v !== v.trim() ? ", COM ESPAÇO" : ""})`;
  });
  // lista os nomes de env que começam com R2 (para pegar typos)
  const parecidas = Object.keys(process.env).filter(k => k.toUpperCase().includes("R2"));
  return NextResponse.json({ status, encontradas_com_R2: parecidas });
}
