import { NextResponse } from "next/server";
import { dbUpdateObProfile } from "@/lib/db";
import { SPECIALTIES } from "@/lib/specialties";
import { getObIdFromCookie } from "@/lib/ob-session";

export const runtime = "nodejs";

const specSet = new Set(SPECIALTIES);

const GRAD_MIN = 1950;
const GRAD_MAX = new Date().getFullYear() + 1;

function validGradYear(y: string): boolean {
  if (!/^\d{4}$/.test(y)) return false;
  const n = Number(y);
  return n >= GRAD_MIN && n <= GRAD_MAX;
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function PATCH(req: Request) {
  const obId = await getObIdFromCookie();
  if (!obId) return bad("ログインが必要です", 401);

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
  const grad_year = String(b.grad_year ?? "").trim();
  const spec = String(b.spec ?? "").trim();
  const affiliation = String(b.affiliation ?? "").trim();
  const msgRaw = b.msg != null ? String(b.msg) : "";
  const msg = msgRaw.trim() || null;

  if (!last || !first) return bad("姓・名は必須です");
  if (!validGradYear(grad_year)) return bad("卒業年度を正しく選んでください");
  if (!spec || !specSet.has(spec)) return bad("専門科を選択してください");
  if (!affiliation) return bad("所属を入力してください");
  if (affiliation.length > 200) return bad("所属は200文字以内にしてください");
  if (msg && msg.length > 200) return bad("研修医へのメッセージは200文字以内にしてください");

  try {
    const r = await dbUpdateObProfile(obId, { last, first, grad_year, spec, affiliation, msg });
    if (r.ok === false && "notFound" in r && r.notFound) return bad("セッションが無効です", 401);
    if (r.ok === false && "duplicateName" in r && r.duplicateName) {
      return bad("その氏名は既に別の登録で使われています", 409);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
