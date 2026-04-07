import { NextResponse } from "next/server";
import { applyAdminSessionCookie, createAdminSessionToken } from "@/lib/admin-session";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  const adminUser = process.env.ADMIN_USER ?? "admin";
  const adminPass =
    process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "development" ? "50th" : undefined);
  if (!adminPass) {
    return NextResponse.json({ error: "サーバーに ADMIN_PASSWORD が設定されていません" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("JSON が不正です");
  }
  const id = typeof body === "object" && body && "id" in body ? String((body as { id: unknown }).id) : "";
  const password =
    typeof body === "object" && body && "password" in body ? String((body as { password: unknown }).password) : "";

  if (id !== adminUser || password !== adminPass) {
    return bad("ID またはパスワードが違います", 401);
  }

  try {
    const token = createAdminSessionToken();
    const res = NextResponse.json({ ok: true });
    return applyAdminSessionCookie(res, token);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "セッションの作成に失敗しました（ADMIN_SESSION_SECRET を確認）" }, { status: 500 });
  }
}
