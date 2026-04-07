import { NextResponse } from "next/server";
import { dbNickAvailable } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nick = (searchParams.get("nick") ?? "").trim();
  if (!nick) {
    return NextResponse.json({ available: false, error: "nick が必要です" }, { status: 400 });
  }
  try {
    const available = await dbNickAvailable(nick);
    return NextResponse.json({ available });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "確認に失敗しました" }, { status: 500 });
  }
}
