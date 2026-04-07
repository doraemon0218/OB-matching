import { NextResponse } from "next/server";
import { dbMarkMypageViewed } from "@/lib/db";

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
  const nick = typeof body === "object" && body && "nick" in body ? String((body as { nick: unknown }).nick).trim() : "";
  if (!nick) return bad("ニックネームを入力してください");

  try {
    const ok = await dbMarkMypageViewed(nick);
    if (!ok) return bad("登録が見つかりません", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
