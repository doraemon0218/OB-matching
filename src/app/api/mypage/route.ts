import { NextResponse } from "next/server";
import { dbGetMypage } from "@/lib/db";

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
    const data = await dbGetMypage(nick);
    if (!data) {
      return bad("そのニックネームの登録が見つかりません", 404);
    }
    const newCount = data.likes.filter((x) => x.isNew).length;
    return NextResponse.json({
      jr: data.jr,
      likes: data.likes,
      stats: {
        likeCount: data.likes.length,
        newCount,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
