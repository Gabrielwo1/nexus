import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, BUCKET } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * Assina várias chaves de uma vez — usado para montar as miniaturas
 * da pasta sem fazer uma requisição por arquivo.
 */
export async function POST(req: NextRequest) {
  const { keys } = await req.json();
  if (!Array.isArray(keys) || !keys.length) {
    return NextResponse.json({ urls: {} });
  }
  try {
    const pares = await Promise.all(
      keys.slice(0, 60).map(async (key: string) => [
        key,
        await getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 }),
      ])
    );
    return NextResponse.json({ urls: Object.fromEntries(pares) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
