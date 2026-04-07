import { NextResponse } from "next/server";
import { dbInsertOb } from "@/lib/db";
import { registrationErrorMessage } from "@/lib/register-errors";
import { SPECIALTIES } from "@/lib/specialties";
import { setObCookie } from "@/lib/ob-session";

export const runtime = "nodejs";

const specSet = new Set(SPECIALTIES);

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("JSON が不正です");
  }
  if (!body || typeof body !== "object") return bad("リクエストが不正です");

  const b = body as Record<string, unknown>;
  const last = String(b.last ?? "").trim();
  const first = String(b.first ?? "").trim();
  const spec = String(b.spec ?? "").trim();
  const msgRaw = b.msg != null ? String(b.msg) : "";
  const msg = msgRaw.trim() || null;

  if (!last || !first) return bad("姓・名は必須です");
  if (!spec || !specSet.has(spec)) return bad("専門科を選択してください");
  if (msg && msg.length > 200) return bad("ひとことは200文字以内にしてください");

  try {
    const id = await dbInsertOb({ last, first, spec, msg });
    await setObCookie(id);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[POST /api/ob]", e);
    return NextResponse.json({ error: registrationErrorMessage(e) }, { status: 500 });
  }
}
