import { NextResponse } from "next/server";
import { dbListAllObsPublic } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 研修医登録フォーム向け：認証不要のOB公開情報リスト */
export async function GET() {
  try {
    const obs = await dbListAllObsPublic();
    return NextResponse.json({ obs });
  } catch (e) {
    console.error("[GET /api/obs/public]", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
