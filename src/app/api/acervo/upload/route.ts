import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, BUCKET, normPrefix, sanitize } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * Gera uma URL assinada para o navegador enviar o arquivo DIRETO ao R2.
 * O arquivo nunca passa pelo servidor — por isso aguenta vídeo de vários GB.
 */
export async function POST(req: NextRequest) {
  const { prefix, nome, contentType } = await req.json();
  if (!nome) return NextResponse.json({ error: "Informe o nome do arquivo" }, { status: 400 });

  const key = normPrefix(prefix) + sanitize(nome);
  try {
    const url = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType || "application/octet-stream" }),
      { expiresIn: 3600 } // 1h para dar conta de arquivo grande
    );
    return NextResponse.json({ url, key });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** URL assinada para baixar/visualizar um arquivo */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Informe a chave" }, { status: 400 });
  try {
    const url = await getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
