/**
 * 登録 API で例外をユーザー向け短文に変換（機微情報は含めない）
 */
export function registrationErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const lower = raw.toLowerCase();

  if (
    raw.includes("NEXT_PUBLIC_SUPABASE") ||
    raw.includes("SUPABASE_SERVICE_ROLE") ||
    raw.includes("環境変数") ||
    raw.includes("ADMIN_SESSION_SECRET")
  ) {
    return "サーバー設定（環境変数）が不足しているか不正です。管理者に連絡するか、Vercel の Environment Variables を確認してください。";
  }

  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "データベースにテーブルがありません。Supabase の SQL エディタで supabase/migrations/001_init.sql を実行してください。";
  }

  if (
    lower.includes("invalid api key") ||
    lower.includes("jwt") ||
    lower.includes("invalid signature") ||
    raw.includes("401") ||
    lower.includes("permission denied for")
  ) {
    return "Supabase の接続情報（URL または Service Role キー）が正しくありません。";
  }

  if (
    raw.includes("EROFS") ||
    raw.includes("EACCES") ||
    raw.includes("EPERM") ||
    lower.includes("read-only file system")
  ) {
    return "サーバーにファイルを保存できません。Vercel 本番では Supabase を設定してください。";
  }

  if (lower.includes("enospc")) {
    return "保存領域が不足しています。";
  }

  if (lower.includes("fetch failed") || lower.includes("econnrefused") || lower.includes("enotfound")) {
    return "データベースに接続できませんでした。Supabase の URL やネットワークを確認してください。";
  }

  if (raw.includes("PGRST") || lower.includes("postgrest")) {
    return "データベースへの要求に失敗しました。テーブル作成と RLS／キーを確認してください。";
  }

  if (raw.startsWith("SUPABASE_INSERT:")) {
    const rest = raw.slice("SUPABASE_INSERT:".length);
    if (rest.includes("23505")) return "このニックネームは既に使われています。";
    return "データの保存に失敗しました。Supabase のログを確認してください。";
  }

  return "登録に失敗しました。時間をおいて再度お試しください。";
}
