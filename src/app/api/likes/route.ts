import { NextResponse } from "next/server";
import { dbToggleLike } from "@/lib/db";
import { getObIdFromCookie } from "@/lib/ob-session";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  const obId = await getObIdFromCookie();
  if (!obId) {
    return bad("OB として登録してください", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("JSON が不正です");
  }
  const jrId = typeof body === "object" && body && "jrId" in body ? String((body as { jrId: unknown }).jrId) : "";
  if (!jrId) return bad("jrId が必要です");

  try {
    const r = await dbToggleLike(obId, jrId);
    if (r === "no_jr") return bad("研修医が見つかりません", 404);
    if (r === "no_ob") return bad("OB セッションが無効です", 401);
    return NextResponse.json({ ok: true, liked: r.liked });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
