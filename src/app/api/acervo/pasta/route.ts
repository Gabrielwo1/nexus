import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
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
