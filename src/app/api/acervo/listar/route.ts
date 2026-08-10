import { NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2, BUCKET, normPrefix } from "@/lib/r2";

export const dynamic = "force-dynamic";

/** Lista o conteúdo de uma "pasta" (prefixo) do bucket */
export async function GET(req: NextRequest) {
  const prefix = normPrefix(req.nextUrl.searchParams.get("prefix"));

  try {
    const pastas: { name: string; prefix: string }[] = [];
    const arquivos: any[] = [];
    let token: string | undefined;

    do {
      const r = await r2.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        Delimiter: "/",
        ContinuationToken: token,
        MaxKeys: 1000,
      }));

      (r.CommonPrefixes || []).forEach(p => {
        const full = p.Prefix!;
        const name = full.slice(prefix.length).replace(/\/$/, "");
        if (name) pastas.push({ name, prefix: full });
      });

      (r.Contents || []).forEach(o => {
        const key = o.Key!;
        // ignora o marcador da própria pasta
        if (key === prefix || key.endsWith("/.keep")) return;
        const name = key.slice(prefix.length);
        if (!name || name.includes("/")) return;
        arquivos.push({
          key,
          name,
          size: o.Size ?? 0,
          updatedAt: o.LastModified?.toISOString() ?? null,
        });
      });

      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);

    pastas.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    arquivos.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return NextResponse.json({ prefix, pastas, arquivos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
