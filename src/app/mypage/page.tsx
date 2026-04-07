"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MypageLike = {
  obId: string;
  name: string;
  spec: string;
  msg: string | null;
  isNew: boolean;
};

type MypageData = {
  jr: {
    nick: string;
    year: "1" | "2";
    specs: [string, string, string];
    mentor: string | null;
  };
  likes: MypageLike[];
  stats: { likeCount: number; newCount: number };
};

export default function MypagePage() {
  const [nick, setNick] = useState("");
  const [data, setData] = useState<MypageData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const markedNick = useRef<string | null>(null);

  useEffect(() => {
    if (!data) {
      markedNick.current = null;
      return;
    }
    const n = data.jr.nick;
    if (markedNick.current === n) return;
    markedNick.current = n;
    void fetch("/api/mypage/mark-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nick: n }),
    });
  }, [data]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/mypage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick: nick.trim() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "取得に失敗しました");
        return;
      }
      setData(j);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    markedNick.current = null;
    setData(null);
    setNick("");
    setErr(null);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold text-stone-800">研修医マイページ</h1>
      <p className="mt-1 text-xs text-stone-500">ニックネームで確認（いいねは OB の実名で表示）</p>

      {!data ? (
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
          )}
          <div>
            <label className="text-xs font-medium text-stone-600">ニックネーム</label>
            <input
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="登録したニックネーム"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "確認中…" : "確認する"}
          </button>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-semibold text-teal-900">
              いいね {data.stats.likeCount} 件
              {data.stats.newCount > 0 && (
                <span className="ml-2 rounded bg-teal-600 px-2 py-0.5 text-xs text-white">新着 {data.stats.newCount}</span>
              )}
            </p>
            <p className="mt-1 text-xs text-teal-800">
              {data.jr.year === "1" ? "1年目" : "2年目"} ／ {data.jr.nick}
            </p>
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-800">登録内容</h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {data.jr.specs.map((s, i) => (
                <li key={i}>
                  <span className="font-medium text-stone-500">{i + 1}位:</span> {s}
                </li>
              ))}
            </ul>
            {data.jr.mentor && (
              <p className="mt-3 border-t border-stone-100 pt-3 text-sm text-stone-600 whitespace-pre-wrap">
                {data.jr.mentor}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-800">いいねしてくれた OB</h2>
            {data.likes.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">まだいいねはありません</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {data.likes.map((l) => (
                  <li key={l.obId} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-stone-900">{l.name}</span>
                      {l.isNew && (
                        <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-stone-900">NEW</span>
                      )}
                    </div>
                    <p className="text-xs text-teal-800">{l.spec}</p>
                    {l.msg && <p className="mt-2 text-sm text-stone-700 whitespace-pre-wrap">{l.msg}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl border border-stone-300 py-2 text-sm font-medium text-stone-700"
          >
            別のニックネームで見る
          </button>
        </div>
      )}

      <p className="mt-10 text-center">
        <Link href="/" className="text-sm text-stone-500 underline">
          トップへ
        </Link>
      </p>
    </main>
  );
}
