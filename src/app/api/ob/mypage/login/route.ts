import { NextResponse } from "next/server";
import { dbFindObByName } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { applyObCookie } from "@/lib/ob-session";

export const runtime = "nodejs";

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
  const password = String(b.password ?? "");

  if (!last || !first) return bad("姓・名を入力してください");
  if (!password) return bad("パスワードを入力してください");

  try {
    const ob = await dbFindObByName(last, first);
    if (!ob || !ob.password_hash) {
      return bad("氏名またはパスワードが正しくありません", 401);
    }
    const ok = await verifyPassword(password, ob.password_hash);
    if (!ok) {
      return bad("氏名またはパスワードが正しくありません", 401);
    }
    const res = NextResponse.json({ ok: true, id: ob.id });
    return applyObCookie(res, ob.id);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "ログインに失敗しました" }, { status: 500 });
  }
}
