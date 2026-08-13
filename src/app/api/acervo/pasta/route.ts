import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { r2, BUCKET, normPrefix, sanitize } from "@/lib/r2";

export const dynamic = "force-dynamic";

/** Cria uma pasta (objeto marcador .keep) */
export async function POST(req: NextRequest) {
  const { prefix, nome } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Informe o nome da pasta" }, { status: 400 });
  const key = normPrefix(prefix) + sanitize(nome.trim()) + "/.keep";
  try {
    await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: "" }));
    return NextResponse.json({ ok: true, prefix: key.replace(/\.keep$/, "") });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * Renomeia uma pasta. O R2 não tem "renomear": copia cada objeto para o
 * novo prefixo e apaga os antigos.
 */
export async function PATCH(req: NextRequest) {
  const { prefix, novoNome } = await req.json();
  const origem = normPrefix(prefix);
  if (!origem || !novoNome?.trim()) {
    return NextResponse.json({ error: "Informe a pasta e o novo nome" }, { status: 400 });
  }

  const partes = origem.replace(/\/$/, "").split("/");
  partes[partes.length - 1] = sanitize(novoNome.trim());
  const destino = partes.join("/") + "/";
  if (destino === origem) return NextResponse.json({ ok: true, prefix: origem });

  try {
    // impede mover uma pasta para dentro dela mesma
    if (destino.startsWith(origem)) {
      return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    }

    let token: string | undefined;
    let total = 0;
    do {
      const r = await r2.send(new ListObjectsV2Command({
        Bucket: BUCKET, Prefix: origem, ContinuationToken: token, MaxKeys: 1000,
      }));
      const objs = r.Contents || [];

      for (const o of objs) {
        await r2.send(new CopyObjectCommand({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/${encodeURIComponent(o.Key!)}`,
          Key: destino + o.Key!.slice(origem.length),
        }));
      }
      if (objs.length) {
        await r2.send(new DeleteObjectsCommand({
          Bucket: BUCKET, Delete: { Objects: objs.map(o => ({ Key: o.Key! })) },
        }));
        total += objs.length;
      }
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);

    // pasta vazia: garante o marcador no destino
    if (!total) {
      await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: destino + ".keep", Body: "" }));
    }

    return NextResponse.json({ ok: true, prefix: destino, movidos: total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** Exclui uma pasta e todo o conteúdo dela */
export async function DELETE(req: NextRequest) {
  const prefix = normPrefix(req.nextUrl.searchParams.get("prefix"));
  if (!prefix) return NextResponse.json({ error: "Informe a pasta" }, { status: 400 });
  try {
    let token: string | undefined;
    let total = 0;
    do {
      const r = await r2.send(new ListObjectsV2Command({
        Bucket: BUCKET, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000,
      }));
      const objs = (r.Contents || []).map(o => ({ Key: o.Key! }));
      if (objs.length) {
        await r2.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: objs } }));
        total += objs.length;
      }
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);
    return NextResponse.json({ ok: true, removidos: total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
