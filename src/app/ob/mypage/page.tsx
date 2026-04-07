"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SPECIALTIES } from "@/lib/specialties";
import type { ObPublic } from "@/lib/types";

const GRAD_MIN = 1950;
const GRAD_MAX = new Date().getFullYear() + 1;

export default function ObMypage() {
  const [me, setMe] = useState<ObPublic | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [loginLast, setLoginLast] = useState("");
  const [loginFirst, setLoginFirst] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginSubmit, setLoginSubmit] = useState(false);

  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [spec, setSpec] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [msg, setMsg] = useState("");

  const gradOptions = useMemo(() => {
    const out: string[] = [];
    for (let y = GRAD_MAX; y >= GRAD_MIN; y--) out.push(String(y));
    return out;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ob/me", { credentials: "include" });
      const j = (await res.json()) as { ob?: ObPublic | null; error?: string };
      if (!res.ok) {
        setMe(null);
        return;
      }
      const ob = j.ob ?? null;
      setMe(ob);
      if (ob) {
        setLast(ob.last);
        setFirst(ob.first);
        setGradYear(ob.grad_year || "");
        setSpec(ob.spec);
        setAffiliation(ob.affiliation || "");
        setMsg(ob.msg ?? "");
      }
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoginSubmit(true);
    try {
      const res = await fetch("/api/ob/mypage/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          last: loginLast.trim(),
          first: loginFirst.trim(),
          password: loginPw,
        }),
      });
      const text = await res.text();
      let j: { error?: string };
      try {
        j = text ? JSON.parse(text) : {};
      } catch {
        setError("サーバー応答が読めませんでした");
        return;
      }
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "ログインに失敗しました");
        return;
      }
      setLoginPw("");
      await refresh();
    } catch {
      setError("通信に失敗しました");
    } finally {
      setLoginSubmit(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/ob/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          last: last.trim(),
          first: first.trim(),
          grad_year: gradYear,
          spec,
          affiliation: affiliation.trim(),
          msg: msg.trim() || null,
        }),
      });
      const text = await res.text();
      let j: { error?: string };
      try {
        j = text ? JSON.parse(text) : {};
      } catch {
        setError("サーバー応答が読めませんでした");
        return;
      }
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "保存に失敗しました");
        return;
      }
      await refresh();
    } catch {
      setError("通信に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/ob/logout", { method: "POST", credentials: "include" });
    setMe(null);
    setLoginLast("");
    setLoginFirst("");
    setLoginPw("");
  }

  if (loading || me === undefined) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-stone-500">読み込み中…</main>
    );
  }

  if (!me) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-bold text-stone-800">OB マイページ</h1>
        <p className="mt-1 text-xs text-stone-500">登録時の氏名とパスワードでログインし、プロフィールを更新できます</p>
        <form onSubmit={onLogin} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-600">姓</label>
              <input
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={loginLast}
                onChange={(e) => setLoginLast(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">名</label>
              <input
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={loginFirst}
                onChange={(e) => setLoginFirst(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">パスワード</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loginSubmit}
            className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loginSubmit ? "ログイン中…" : "ログイン"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-stone-600">
          <Link href="/ob" className="text-teal-700 underline">
            新規登録・研修医一覧へ
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-stone-500 underline">
            トップへ
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-stone-800">OB マイページ</h1>
          <p className="mt-1 text-xs text-stone-500">
            {me.last} {me.first} ／ 卒業 {me.grad_year || "—"} 年
          </p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="text-xs text-stone-500 underline"
        >
          ログアウト
        </button>
      </div>

      <form onSubmit={onSave} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-stone-600">姓</label>
            <input
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={last}
              onChange={(e) => setLast(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">名</label>
            <input
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">卒業年度</label>
          <select
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={gradYear}
            onChange={(e) => setGradYear(e.target.value)}
          >
            <option value="">選択してください</option>
            {gradOptions.map((y) => (
              <option key={y} value={y}>
                {y} 年
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">専門科</label>
          <select
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
          >
            <option value="">選択してください</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">所属</label>
          <input
            required
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">研修医へのメッセージ（任意・200字以内）</label>
          <textarea
            maxLength={200}
            rows={3}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-stone-400">{msg.length} / 200</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存する"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm">
        <Link href="/ob" className="text-teal-700 underline">
          研修医一覧へ
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-stone-500 underline">
          トップへ
        </Link>
      </p>
    </main>
  );
}
