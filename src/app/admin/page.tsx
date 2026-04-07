"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Stats = {
  jrCount: number;
  obCount: number;
  likeCount: number;
  jrsWithLikes: number;
};

type Tab = "jrs" | "obs" | "matching";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | undefined>(undefined);
  const [id, setId] = useState("admin");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<Tab>("jrs");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { credentials: "include" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    const j = await res.json();
    setStats(j);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadTable = useCallback(async (t: Tab) => {
    setTableLoading(true);
    try {
      const res = await fetch(`/api/admin/table?tab=${t}`, { credentials: "include" });
      const j = await res.json();
      if (!res.ok) {
        setRows([]);
        return;
      }
      setRows(j.rows ?? []);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadTable(tab);
  }, [authed, tab, loadTable]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, password }),
      });
      const j = await res.json();
      if (!res.ok) {
        setLoginErr(j.error ?? "ログインに失敗しました");
        return;
      }
      setPassword("");
      await checkAuth();
    } finally {
      setLoginLoading(false);
    }
  }

  async function skipLogin() {
    setLoginErr(null);
    setSkipLoading(true);
    try {
      const res = await fetch("/api/admin/skip-login", {
        method: "POST",
        credentials: "include",
      });
      const text = await res.text();
      let j: { error?: string; ok?: boolean };
      try {
        j = text ? JSON.parse(text) : {};
      } catch {
        setLoginErr(`応答が読めません（HTTP ${res.status}）`);
        return;
      }
      if (!res.ok) {
        setLoginErr(typeof j.error === "string" ? j.error : "スキップログインに失敗しました");
        return;
      }
      await checkAuth();
    } catch {
      setLoginErr("通信に失敗しました");
    } finally {
      setSkipLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthed(false);
    setStats(null);
    setRows([]);
  }

  if (authed === undefined) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-stone-500">
        確認中…
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-xl font-bold text-stone-800">実行委員ログイン</h1>
        <p className="mt-1 text-xs text-stone-500">URL は <code className="rounded bg-stone-100 px-1">/admin</code> です。</p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-950 leading-relaxed">
          <p className="font-semibold text-amber-900">パスワードの扱い（仕様）</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              仕様書どおりのプロトタイプでは <strong>ID: admin</strong> ／ <strong>パスワード: 50th</strong> です。
            </li>
            <li>
              <strong>ローカルで開発サーバー</strong>（<code className="rounded bg-white/70 px-1">npm run dev</code>
              ）のときは、環境変数未設定なら上記の組み合わせでログインできます。
            </li>
            <li>
              <strong>Vercel など本番</strong>では、ダッシュボードの Environment Variables に{" "}
              <code className="rounded bg-white/70 px-1">ADMIN_PASSWORD</code>（必須）と{" "}
              <code className="rounded bg-white/70 px-1">ADMIN_SESSION_SECRET</code>（16文字以上・必須）、必要なら{" "}
              <code className="rounded bg-white/70 px-1">ADMIN_USER</code> を設定してください。未設定だとログインできません。
            </li>
          </ul>
        </div>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <form onSubmit={login} className="space-y-4">
            {loginErr && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{loginErr}</div>
            )}
            <div>
              <label className="text-xs font-medium text-stone-600">ID</label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">パスワード</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading || skipLoading}
              className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loginLoading ? "…" : "ログイン"}
            </button>
          </form>

          <div className="mt-4 border-t border-stone-200 pt-4">
            <p className="text-xs font-medium text-stone-600">ID / パスワードを省略</p>
            <p className="mt-1 text-[11px] leading-snug text-stone-500">
              <code className="rounded bg-stone-100 px-0.5">npm run dev</code> では利用可。本番は{" "}
              <code className="rounded bg-stone-100 px-0.5">ADMIN_DEV_SKIP=1</code> が必要（公開サイトはオフ推奨）。
            </p>
            <button
              type="button"
              disabled={loginLoading || skipLoading}
              onClick={() => skipLogin()}
              className="mt-3 w-full rounded-xl border-2 border-teal-600 bg-teal-50 py-3 text-sm font-bold text-teal-900 hover:bg-teal-100 disabled:opacity-50"
            >
              {skipLoading ? "処理中…" : "Skip — ログイン画面へ進む"}
            </button>
          </div>
        </div>
        <p className="mt-8 text-center">
          <Link href="/" className="text-sm text-stone-500 underline">
            トップへ
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-stone-800">実行委員管理</h1>
        <div className="flex gap-2">
          <Link
            href="/api/admin/export?type=jrs"
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
          >
            CSV: 研修医
          </Link>
          <Link
            href="/api/admin/export?type=obs"
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
          >
            CSV: OB
          </Link>
          <Link
            href="/api/admin/export?type=matching"
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
          >
            CSV: マッチング
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800"
          >
            ログアウト
          </button>
        </div>
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["研修医登録", stats.jrCount],
            ["OB登録", stats.obCount],
            ["いいね総数", stats.likeCount],
            ["いいねされたJR", stats.jrsWithLikes],
          ].map(([label, n]) => (
            <div key={String(label)} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-stone-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-stone-900">{n}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {(
          [
            ["jrs", "研修医一覧"],
            ["obs", "OB一覧"],
            ["matching", "マッチング状況"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === k ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        {tableLoading ? (
          <p className="p-6 text-sm text-stone-500">読み込み中…</p>
        ) : (
          <table className="min-w-full text-left text-xs text-stone-800">
            <thead className="border-b border-stone-200 bg-stone-50">
              {tab === "jrs" && (
                <tr>
                  {["姓", "名", "ニックネーム", "年次", "科1", "科2", "科3", "師匠像", "いいね", "いいねOB"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              )}
              {tab === "obs" && (
                <tr>
                  {["姓", "名", "卒業", "専門科", "所属", "ひとこと", "いいね", "JRニックネーム"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              )}
              {tab === "matching" && (
                <tr>
                  {["ニックネーム", "年次", "いいねOB"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {tab === "jrs" &&
                rows.map((r, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className="px-3 py-2">{String(r.last ?? "")}</td>
                    <td className="px-3 py-2">{String(r.first ?? "")}</td>
                    <td className="px-3 py-2">{String(r.nick ?? "")}</td>
                    <td className="px-3 py-2">{String(r.year ?? "")}</td>
                    <td className="max-w-[120px] truncate px-3 py-2" title={String(r.spec1 ?? "")}>
                      {String(r.spec1 ?? "")}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2" title={String(r.spec2 ?? "")}>
                      {String(r.spec2 ?? "")}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2" title={String(r.spec3 ?? "")}>
                      {String(r.spec3 ?? "")}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2" title={String(r.mentor ?? "")}>
                      {String(r.mentor ?? "")}
                    </td>
                    <td className="px-3 py-2">{String(r.likeCount ?? "")}</td>
                    <td className="max-w-[240px] truncate px-3 py-2" title={String(r.obNames ?? "")}>
                      {String(r.obNames ?? "")}
                    </td>
                  </tr>
                ))}
              {tab === "obs" &&
                rows.map((r, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className="px-3 py-2">{String(r.last ?? "")}</td>
                    <td className="px-3 py-2">{String(r.first ?? "")}</td>
                    <td className="whitespace-nowrap px-3 py-2">{String(r.grad_year ?? "")}</td>
                    <td className="max-w-[140px] truncate px-3 py-2" title={String(r.spec ?? "")}>
                      {String(r.spec ?? "")}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2" title={String(r.affiliation ?? "")}>
                      {String(r.affiliation ?? "")}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2" title={String(r.msg ?? "")}>
                      {String(r.msg ?? "")}
                    </td>
                    <td className="px-3 py-2">{String(r.likeCount ?? "")}</td>
                    <td className="max-w-[240px] truncate px-3 py-2" title={String(r.jrNicks ?? "")}>
                      {String(r.jrNicks ?? "")}
                    </td>
                  </tr>
                ))}
              {tab === "matching" &&
                rows.map((r, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className="px-3 py-2">{String(r.nick ?? "")}</td>
                    <td className="px-3 py-2">{String(r.year ?? "")}</td>
                    <td className="px-3 py-2 text-sm">{String(r.obSummary ?? "")}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-stone-400">
        マッチング CSV は Excel 向け BOM 付き UTF-8 です。
      </p>
    </main>
  );
}
