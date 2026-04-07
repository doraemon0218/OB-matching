import { NextResponse } from "next/server";
import { applyAdminSessionCookie, createAdminSessionToken } from "@/lib/admin-session";

export const runtime = "nodejs";

/**
 * ID/パスワード入力を省略して管理セッションのみ発行する。
 * - NODE_ENV=development（npm run dev）のときのみ許可、または
 * - ADMIN_DEV_SKIP=1 のとき（式典デモ等・自己責任で本番でも有効化可能）
 */
export async function POST() {
  const allowed =
    process.env.NODE_ENV === "development" || process.env.ADMIN_DEV_SKIP === "1";
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "スキップログインはこの環境では無効です。ADMIN_DEV_SKIP=1 を設定するか、通常ログインを使ってください。",
      },
      { status: 403 }
    );
  }

  try {
    const token = createAdminSessionToken();
    const res = NextResponse.json({ ok: true, skipped: true });
    return applyAdminSessionCookie(res, token);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "セッションの作成に失敗しました（ADMIN_SESSION_SECRET を確認）" },
      { status: 500 }
    );
  }
}
