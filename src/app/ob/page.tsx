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
            <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
              いいね済み
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onToggleLike(jr.id)}
              className="rounded-full bg-stone-800 px-4 py-1.5 text-xs font-semibold text-white"
            >
              いいね
            </button>
          )}
          <p className="mt-2 text-xs text-stone-500">{jr.likeCount}人からいいね</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {jr.specs.map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-1 rounded-lg border border-stone-100 bg-stone-50 px-2 py-1 text-xs text-stone-800"
          >
            {rankBadge((i + 1) as 1 | 2 | 3)}
            <span>{s}</span>
          </li>
        ))}
      </ul>
      {jr.mentor && (
        <p className="mt-3 border-t border-stone-100 pt-3 text-sm text-stone-700 whitespace-pre-wrap">{jr.mentor}</p>
      )}
    </article>
  );
}

export default function ObPage() {
  const [me, setMe] = useState<ObPublic | null | undefined>(undefined);
  const [loadingMe, setLoadingMe] = useState(true);

  const [agreed, setAgreed] = useState(false);
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regErr, setRegErr] = useState<string | null>(null);
  const [regSubmit, setRegSubmit] = useState(false);

  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
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

  const refreshMe = useCallback(async () => {
    setLoadingMe(true);
    try {
      const res = await fetch("/api/ob/me", { credentials: "include" });
      const j = (await res.json()) as { ob?: ObPublic | null };
      if (!res.ok) {
        setMe(null);
        return;
      }
      setMe(j.ob ?? null);
    } catch {
      setMe(null);
    } finally {
      setLoadingMe(false);
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
        if (res.status === 401) setMe(null);
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
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (me) loadJrs();
  }, [me, loadJrs]);

  function goStep2(e: React.FormEvent) {
    e.preventDefault();
    setRegErr(null);
    const L = last.trim();
    const F = first.trim();
    if (!L || !F) {
      setRegErr("姓・名を入力してください");
      return;
    }
    if (password.length < 8) {
      setRegErr("パスワードは8文字以上にしてください");
      return;
    }
    if (password !== password2) {
      setRegErr("パスワードが一致しません");
      return;
    }
    setRegStep(2);
  }

  async function onRegisterFinal(e: React.FormEvent) {
    e.preventDefault();
    setRegErr(null);
    setRegSubmit(true);
    try {
      const res = await fetch("/api/ob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          last: last.trim(),
          first: first.trim(),
          password,
          grad_year: gradYear,
          spec,
          affiliation: affiliation.trim(),
          msg: msg.trim() || null,
        }),
      });
      const text = await res.text();
      let j: { error?: string; ok?: boolean };
      try {
        j = text ? JSON.parse(text) : {};
      } catch {
        setRegErr(`サーバー応答が読めません（HTTP ${res.status}）。しばらくしてから再度お試しください。`);
        return;
      }
      if (!res.ok) {
        const msgErr =
          typeof j.error === "string" && j.error.trim()
            ? j.error
            : `登録に失敗しました（HTTP ${res.status}）。Vercel のログと Supabase の設定を確認してください。`;
        setRegErr(msgErr);
        return;
      }
      setPassword("");
      setPassword2("");
      await refreshMe();
    } catch {
      setRegErr("通信に失敗しました。接続を確認してから再度お試しください。");
    } finally {
      setRegSubmit(false);
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
        return {
          ...r,
          likedByMe: liked,
          likeCount: r.likeCount + (liked ? 1 : -1),
        };
      })
    );
  }

  const rankBadge = (n: 1 | 2 | 3) => (
    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-teal-100 px-1 text-[10px] font-bold text-teal-900">
      {n}
    </span>
  );

  const specNote = specF !== "all" ? `診療科フィルター: ${specF}` : null;

  if (loadingMe) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-stone-500">
        読み込み中…
      </main>
    );
  }

  if (!me) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-bold text-stone-800">OB 登録</h1>
        <p className="mt-1 text-xs text-stone-500">同意のうえ登録すると、研修医一覧へ進めます（研修医にはニックネームのみ表示）</p>

        {!agreed ? (
          <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-800">ご利用にあたって</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-stone-700">
              <li>本登録は記名式です。氏名は実行委員が管理し、研修医には公開されません。</li>
              <li>パスワードはログイン用にのみ用い、平文では保存しません。</li>
              <li>データはマッチング目的以外に使用せず、式典終了後に廃棄します。</li>
            </ul>
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="text-sm text-stone-800">上記を理解し、同意します</span>
            </label>
            <p className="mt-4 text-xs text-stone-500">
              同意いただけない場合は、式典当日にスタッフへ直接お声がけください。
            </p>
          </section>
        ) : regStep === 1 ? (
          <form onSubmit={goStep2} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            {regErr && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{regErr}</div>
            )}
            <p className="text-sm font-semibold text-stone-800">アカウント（氏名・パスワード）</p>
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
              <label className="text-xs font-medium text-stone-600">パスワード（8文字以上）</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">パスワード（確認）</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white">
              次へ（プロフィール入力）
            </button>
          </form>
        ) : (
          <form onSubmit={onRegisterFinal} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            {regErr && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{regErr}</div>
            )}
            <p className="text-sm font-semibold text-stone-800">プロフィール</p>
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRegStep(1);
                  setRegErr(null);
                }}
                className="flex-1 rounded-xl border border-stone-300 bg-stone-50 py-3 text-sm font-semibold text-stone-800"
              >
                戻る
              </button>
              <button
                type="submit"
                disabled={regSubmit}
                className="flex-[2] rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {regSubmit ? "登録中…" : "登録して一覧へ"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-sm">
          <Link href="/ob/mypage" className="text-teal-700 underline">
            既に登録済みの方はマイページへ
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-stone-800">研修医一覧（年次別）</h1>
          <p className="text-xs text-stone-500">
            ログイン中: {me.last} {me.first} ／ {me.spec}
            {me.grad_year ? ` ／ 卒業 ${me.grad_year}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link href="/ob/mypage" className="text-teal-700 underline">
            OBマイページ
          </Link>
          <Link href="/" className="text-stone-500 underline">
            トップ
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <label className="block text-[10px] font-medium uppercase tracking-wide text-stone-500">
            興味のある診療科で絞り込み（Top3 のいずれかに含む）
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            value={specF}
            onChange={(e) => setSpecF(e.target.value)}
          >
            <option value="all">すべて表示</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => loadJrs()}
          className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-700"
        >
          更新
        </button>
      </div>
      {specNote && <p className="mt-2 text-xs text-stone-600">{specNote}</p>}
      {likeErr && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{likeErr}</div>
      )}

      {loadingJrs && <p className="mt-6 text-sm text-stone-500">一覧を読み込み中…</p>}

      {!loadingJrs && (
        <div className="mt-8 space-y-10">
          <section>
            <div className="flex items-baseline gap-2 border-b border-stone-200 pb-2">
              <h2 className="text-lg font-bold text-stone-800">1年目研修医</h2>
              <span className="text-sm text-stone-500">（{jrsYear1.length}名）</span>
            </div>
            <div className="mt-4 space-y-4">
              {jrsYear1.length === 0 ? (
                <p className="text-sm text-stone-500">該当する研修医がいません</p>
              ) : (
                jrsYear1.map((jr) => (
                  <JrCard key={jr.id} jr={jr} rankBadge={rankBadge} onToggleLike={toggleLike} />
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-baseline gap-2 border-b border-stone-200 pb-2">
              <h2 className="text-lg font-bold text-stone-800">2年目研修医</h2>
              <span className="text-sm text-stone-500">（{jrsYear2.length}名）</span>
            </div>
            <div className="mt-4 space-y-4">
              {jrsYear2.length === 0 ? (
                <p className="text-sm text-stone-500">該当する研修医がいません</p>
              ) : (
                jrsYear2.map((jr) => (
                  <JrCard key={jr.id} jr={jr} rankBadge={rankBadge} onToggleLike={toggleLike} />
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
