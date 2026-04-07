import { NextResponse } from "next/server";
import { dbListJrsForOb } from "@/lib/db";
import { getObIdFromCookie } from "@/lib/ob-session";
import { SPECIALTIES } from "@/lib/specialties";

export const runtime = "nodejs";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(req: Request) {
  const obId = await getObIdFromCookie();
  if (!obId) {
    return bad("OB として登録してください", 401);
  }

  const { searchParams } = new URL(req.url);
  const specFilter = searchParams.get("spec") ?? "all";

  if (specFilter !== "all" && !SPECIALTIES.includes(specFilter)) {
    return bad("spec パラメータが不正です");
  }

  try {
    const rows = await dbListJrsForOb(obId, { spec: specFilter });
    if (rows === null) {
      return bad("OB セッションが無効です", 401);
    }
    return NextResponse.json({ jrs: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
