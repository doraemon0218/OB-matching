import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { dbAdminStats } from "@/lib/db";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const stats = await dbAdminStats();
    return NextResponse.json(stats);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
