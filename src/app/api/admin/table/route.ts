import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { dbAdminTable, type AdminTab } from "@/lib/db";

export const runtime = "nodejs";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab = (searchParams.get("tab") ?? "jrs") as AdminTab;
  if (tab !== "jrs" && tab !== "obs" && tab !== "matching") {
    return bad("tab が不正です");
  }

  try {
    const rows = await dbAdminTable(tab);
    return NextResponse.json({ rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
