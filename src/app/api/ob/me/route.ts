import { NextResponse } from "next/server";
import { dbGetObById } from "@/lib/db";
import { getObIdFromCookie } from "@/lib/ob-session";

export async function GET() {
  const obId = await getObIdFromCookie();
  if (!obId) {
    return NextResponse.json({ ob: null });
  }
  try {
    const data = await dbGetObById(obId);
    if (!data) {
      return NextResponse.json({ ob: null });
    }
    return NextResponse.json({ ob: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
