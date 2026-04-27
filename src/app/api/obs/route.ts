import { NextResponse } from "next/server";
import { dbListObsForJr } from "@/lib/db";

export const runtime = "nodejs";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nick = searchParams.get("nick")?.trim() ?? "";
  if (!nick) return bad("nick パラメータが必要です");
  try {
    const obs = await dbListObsForJr(nick);
    if (!obs) return bad("そのニックネームの登録が見つかりません", 404);
    return NextResponse.json({ obs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
