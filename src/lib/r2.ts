import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cliente do Cloudflare R2 (S3-compatible).
 * Só roda no servidor — as chaves nunca chegam ao navegador.
 */
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.R2_BUCKET || "yphe-midias";

/** Normaliza um caminho de pasta: sem barra inicial, com barra final */
export function normPrefix(prefix?: string | null): string {
  if (!prefix) return "";
  let p = prefix.replace(/^\/+/, "").replace(/\/+$/, "");
  return p ? p + "/" : "";
}

/** Remove caracteres problemáticos de nomes de arquivo/pasta */
export function sanitize(nome: string): string {
  return nome.replace(/[\\?%*:|"<>]/g, "-").trim();
}
