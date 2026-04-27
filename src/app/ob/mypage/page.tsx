"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { SPECIALTIES } from "@/lib/specialties";
import type { JrPublic, ObPublic } from "@/lib/types";

const GRAD_MIN = 1950;
const GRAD_MAX = new Date().getFullYear() + 1;

function JrCard({
  jr,
  rankBadge,
  onToggleLike,
}: {
  jr: JrPublic;
  rankBadge: (n: 1 | 2 | 3) => ReactNode;
  onToggleLike: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-stone-900">{jr.nick}</p>
          <p className="text-xs text-stone-500">{jr.year === "1" ? "1年目" : "2年目"}</p>
        </div>
        <div className="text-right">
          {jr.likedByMe ? (
            <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">いいね済み</span>
          ) : (
            <button type="button" onClick={() => onToggleLike(jr.id)} className="rounded-full bg-stone-800 px-4 py-1.5 text-xs font-semibold text-white">いいね</button>
          )}
          <p className="mt-2 text-xs text-stone-500">{jr.likeCount}人からいいね</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {jr.specs.map((s, i) => (
          <li key={i} className="flex items-center gap-1 rounded-lg border border-stone-100 bg-stone-50 px-2 py-1 text-xs text-stone-800">
            {rankBadge((i + 1) as 1 | 2 | 3)}
            <span>{s}</span>
          </li>
        ))}
      </ul>
      {jr.mentor && <p className="mt-3 border-t border-stone-100 pt-3 text-sm text-stone-700 whitespace-pre-wrap">{jr.mentor}</p>}
    </article>
  );
}

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

  const [jrs, setJrs] = useState<JrPublic[]>([]);
  const [loadingJrs, setLoadingJrs] = useState(false);
  const [specF, setSpecF] = useState<string>("all");
  const [likeErr, setLikeErr] = useState<string | null>(null);

  const jrsYear1 = useMemo(() => jrs.filter((j) => j.year === "1"), [jrs]);
  const jrsYear2 = useMemo(() => jrs.filter((j) => j.year === "2"), [jrs]);

  const gradOptions = useMemo(() => {
    const out: string[] = [];
    for (let y = GRAD_MAX; y >= GRAD_MIN; y--) out.push(String(y));
    return out;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ob/me", { credentials: "include" });
      const j = (await res.json()) as { ob?: ObPublic | null };
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

  const loadJrs = useCallback(async () => {
    setLoadingJrs(true);
    setLikeErr(null);
    try {
      const q = new URLSearchParams();
      if (specF !== "all") q.set("spec", specF);
      const res = await fetch(`/api/jrs?${q}`, { credentials: "include" });
      const j = await res.json();
      if (!res.ok) {
        setJrs([]);
        return;
      }
      setJrs(j.jrs ?? []);
    } catch {
      setJrs([]);
    } finally {
      setLoadingJrs(false);
    }
  }, [specF]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (me) void loadJrs();
  }, [me, loadJrs]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoginSubmit(true);
    try {
      const res = await fetch("/api/ob/mypage/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ last: loginLast.trim(), first: loginFirst.trim(), password: loginPw }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "ログインに失敗しました");
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
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "保存に失敗しました");
        return;
      }
      await refresh();
    } catch {
      setError("通信に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function toggleLike(jrId: string) {
    setLikeErr(null);
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ jrId }),
    });
    const j = await res.json();
    if (!res.ok) {
      setLikeErr(j.error ?? "いいねの更新に失敗しました");
      return;
    }
    setJrs((prev) =>
      prev.map((r) => {
        if (r.id !== jrId) return r;
        const liked = Boolean(j.liked);
        return { ...r, likedByMe: liked, likeCount: r.likeCount + (liked ? 1 : -1) };
      })
    );
  }

  async function logout() {
    await fetch("/api/ob/logout", { method: "POST", credentials: "include" });
    setMe(null);
    setJrs([]);
    setLoginLast("");
    setLoginFirst("");
    setLoginPw("");
  }

  const rankBadge = (n: 1 | 2 | 3) => (
    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-teal-100 px-1 text-[10px] font-bold text-teal-900">{n}</span>
  );

  if (loading || me === undefined) {
    return <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-stone-500">読み込み中…</main>;
  }

  if (!me) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-bold text-stone-800">OBログイン画面</h1>
        <p className="mt-1 text-xs text-stone-500">ログイン後に研修医一覧を閲覧できます</p>
        <form onSubmit={onLogin} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-600">姓</label>
              <input required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={loginLast} onChange={(e) => setLoginLast(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">名</label>
              <input required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={loginFirst} onChange={(e) => setLoginFirst(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">パスワード</label>
            <input type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} />
          </div>
          <button type="submit" disabled={loginSubmit} className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50">{loginSubmit ? "ログイン中…" : "ログイン"}</button>
        </form>
        <p className="mt-8 text-center text-sm">未登録の方は <Link href="/ob" className="text-teal-700 underline">OB登録画面</Link></p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-stone-800">OBマイページ</h1>
          <p className="mt-1 text-xs text-stone-500">{me.last} {me.first} ／ 卒業 {me.grad_year || "-"} 年</p>
        </div>
        <button type="button" onClick={() => logout()} className="text-xs text-stone-500 underline">ログアウト</button>
      </div>

      <form onSubmit={onSave} className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
        <h2 className="text-sm font-semibold text-stone-800">プロフィール更新</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-stone-600">姓</label><input required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={last} onChange={(e) => setLast(e.target.value)} /></div>
          <div><label className="text-xs font-medium text-stone-600">名</label><input required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={first} onChange={(e) => setFirst(e.target.value)} /></div>
        </div>
        <div><label className="text-xs font-medium text-stone-600">卒業年度</label><select required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={gradYear} onChange={(e) => setGradYear(e.target.value)}><option value="">選択してください</option>{gradOptions.map((y) => <option key={y} value={y}>{y} 年</option>)}</select></div>
        <div><label className="text-xs font-medium text-stone-600">専門科</label><select required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={spec} onChange={(e) => setSpec(e.target.value)}><option value="">選択してください</option>{SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className="text-xs font-medium text-stone-600">所属</label><input required maxLength={200} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} /></div>
        <div><label className="text-xs font-medium text-stone-600">研修医へのメッセージ（任意・200字以内）</label><textarea maxLength={200} rows={3} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={msg} onChange={(e) => setMsg(e.target.value)} /><p className="mt-1 text-right text-xs text-stone-400">{msg.length} / 200</p></div>
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "保存中…" : "保存する"}</button>
      </form>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="text-sm font-semibold text-stone-800">研修医一覧（ログイン後閲覧）</h2>
          <div className="min-w-[200px] flex-1">
            <select className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm" value={specF} onChange={(e) => setSpecF(e.target.value)}>
              <option value="all">すべて表示</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => void loadJrs()} className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-700">更新</button>
        </div>
        {likeErr && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{likeErr}</div>}
        {loadingJrs ? (
          <p className="mt-4 text-sm text-stone-500">読み込み中…</p>
        ) : (
          <div className="mt-6 space-y-8">
            <div>
              <p className="text-sm font-semibold text-stone-700">1年目（{jrsYear1.length}名）</p>
              <div className="mt-3 space-y-3">{jrsYear1.length === 0 ? <p className="text-sm text-stone-500">該当なし</p> : jrsYear1.map((jr) => <JrCard key={jr.id} jr={jr} rankBadge={rankBadge} onToggleLike={toggleLike} />)}</div>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-700">2年目（{jrsYear2.length}名）</p>
              <div className="mt-3 space-y-3">{jrsYear2.length === 0 ? <p className="text-sm text-stone-500">該当なし</p> : jrsYear2.map((jr) => <JrCard key={jr.id} jr={jr} rankBadge={rankBadge} onToggleLike={toggleLike} />)}</div>
            </div>
          </div>
        )}
      </section>

      <p className="mt-8 text-center"><Link href="/" className="text-sm text-stone-500 underline">トップへ</Link></p>
    </main>
  );
}
