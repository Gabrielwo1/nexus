import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { r2, BUCKET, sanitize } from "@/lib/r2";

export const dynamic = "force-dynamic";

/** Exclui um arquivo */
export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Informe a chave" }, { status: 400 });
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** Renomeia (copia para o novo nome e apaga o antigo) */
export async function PATCH(req: NextRequest) {
  const { key, novoNome } = await req.json();
  if (!key || !novoNome?.trim()) {
    return NextResponse.json({ error: "Informe a chave e o novo nome" }, { status: 400 });
  }
  const pasta = key.slice(0, key.lastIndexOf("/") + 1);
  const destino = pasta + sanitize(novoNome.trim());
  try {
    await r2.send(new CopyObjectCommand({
      Bucket: BUCKET, CopySource: `${BUCKET}/${encodeURIComponent(key)}`, Key: destino,
    }));
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return NextResponse.json({ ok: true, key: destino });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
