import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

/**
 * デプロイ先の状態確認（秘密は返さない）
 */
export async function GET() {
  const supabase = isSupabaseConfigured();
  const vercel = Boolean(process.env.VERCEL);
  const localTarget = vercel ? "/tmp/ob-matching-local-db.json" : path.join(process.cwd(), "data", "local-db.json");

  let canWriteLocal = false;
  try {
    const base = vercel ? "/tmp" : path.join(process.cwd(), "data");
    await mkdir(base, { recursive: true });
    const probe = path.join(base, `.ob-match-probe-${process.pid}`);
    await writeFile(probe, "ok", "utf8");
    await unlink(probe);
    canWriteLocal = true;
  } catch {
    canWriteLocal = false;
  }

  return NextResponse.json({
    ok: true,
    supabaseConfigured: supabase,
    vercel,
    nodeEnv: process.env.NODE_ENV ?? "",
    localDbPath: supabase ? null : localTarget,
    localStorageWritable: supabase ? null : canWriteLocal,
    hint: supabase
      ? "Supabase モードです。登録できないときは SQL で jrs / obs / likes テーブルを作成し、SERVICE ROLE キーを設定してください。"
      : canWriteLocal
        ? "ローカル JSON モードです（ファイルに保存）。"
        : "ローカル保存先に書き込めません。Vercel では Supabase を設定してください。",
  });
}
