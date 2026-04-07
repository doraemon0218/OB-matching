/**
 * 登録 API で例外をユーザー向け短文に変換（機微情報は含めない）
 */

function collectErrorText(e: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let cur: unknown = e;
  let depth = 0;
  while (cur != null && depth < 8 && !seen.has(cur)) {
    seen.add(cur);
    if (cur instanceof Error) {
      if (cur.message) parts.push(cur.message);
      cur = cur.cause;
    } else if (typeof cur === "object" && cur !== null && "message" in cur) {
      const m = (cur as { message: unknown }).message;
      if (typeof m === "string" && m) parts.push(m);
      cur = "cause" in cur ? (cur as { cause: unknown }).cause : null;
    } else {
      parts.push(String(cur));
      break;
    }
    depth++;
  }
  return parts.join(" | ");
}

export function registrationErrorMessage(e: unknown): string {
  const raw = collectErrorText(e);
  const lower = raw.toLowerCase();

  if (
    raw.includes("NEXT_PUBLIC_SUPABASE") ||
    raw.includes("SUPABASE_SERVICE_ROLE") ||
    raw.includes("環境変数") ||
    raw.includes("ADMIN_SESSION_SECRET")
  ) {
    return "サーバー設定（環境変数）が不足しているか不正です。管理者に連絡するか、Vercel の Environment Variables を確認してください。";
  }

  if (
    lower.includes("cookies can only be modified") ||
    lower.includes("cookie") && lower.includes("route")
  ) {
    return "セッション Cookie の設定に失敗しました。アプリを再デプロイするか、管理者に連絡してください。";
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

  if (raw.startsWith("SUPABASE_INSERT:") || raw.includes("SUPABASE_INSERT:")) {
    if (raw.includes("23505")) return "このニックネームは既に使われています。";
    return "データの保存に失敗しました。Supabase の Table Editor / Logs でエラー内容を確認してください。";
  }

  if (raw.trim().length > 0) {
    let short = raw.length > 160 ? `${raw.slice(0, 160)}…` : raw;
    short = short.replace(/https?:\/\/\S+/gi, "(URL)");
    return `登録に失敗しました（${short}）。Supabase のテーブル作成と Vercel の環境変数を確認してください。`;
  }

  return "登録に失敗しました。Supabase で SQL を実行し、Vercel に NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。";
}
