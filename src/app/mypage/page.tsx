"use client";

import Link from "next/link";
import { useState } from "react";

type JrData = {
  nick: string;
  year: "1" | "2";
  specs: [string, string, string];
  mentor: string | null;
};

export default function MypagePage() {
  const [nick, setNick] = useState("");
  const [data, setData] = useState<JrData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setData(j.jr as JrData);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setData(null);
    setNick("");
    setErr(null);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold text-stone-800">研修医マイページ</h1>
      <p className="mt-1 text-xs text-stone-500">ニックネームで登録内容を確認できます</p>

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
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "確認中…" : "確認する"}
          </button>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-semibold text-teal-900">
              {data.year === "1" ? "1年目" : "2年目"} ／ {data.nick}
            </p>
            <p className="mt-1 text-xs text-teal-700">登録済みです</p>
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-800">希望診療科</h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {data.specs.map((s, i) => (
                <li key={i}>
                  <span className="font-medium text-stone-500">{i + 1}位:</span> {s}
                </li>
              ))}
            </ul>
            {data.mentor && (
              <div className="mt-3 border-t border-stone-100 pt-3">
                <p className="text-xs font-medium text-stone-400">こんな師匠に出会いたい</p>
                <p className="mt-1 text-sm text-stone-600 whitespace-pre-wrap">{data.mentor}</p>
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl border border-stone-300 py-2 text-sm font-medium text-stone-700"
          >
            別のニックネームで確認する
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
