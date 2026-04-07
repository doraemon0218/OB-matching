"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SPECIALTIES } from "@/lib/specialties";

export default function JrRegisterPage() {
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [nick, setNick] = useState("");
  const [nickOk, setNickOk] = useState<boolean | null>(null);
  const [year, setYear] = useState<"1" | "2" | "">("");
  const [spec1, setSpec1] = useState("");
  const [spec2, setSpec2] = useState("");
  const [spec3, setSpec3] = useState("");
  const [mentor, setMentor] = useState("");

  const opts2 = useMemo(() => SPECIALTIES.filter((s) => s !== spec1), [spec1]);
  const opts3 = useMemo(() => SPECIALTIES.filter((s) => s !== spec1 && s !== spec2), [spec1, spec2]);

  async function checkNick(n: string) {
    const t = n.trim();
    if (!t) {
      setNickOk(null);
      return;
    }
    const res = await fetch(`/api/jr/nick-available?nick=${encodeURIComponent(t)}`);
    const j = await res.json();
    setNickOk(Boolean(j.available));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/jr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          last,
          first,
          nick,
          year,
          spec1,
          spec2,
          spec3,
          mentor,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "送信に失敗しました");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-6 py-8 text-center">
          <p className="text-lg font-semibold text-teal-900">登録が完了しました</p>
          <p className="mt-3 text-sm text-teal-800">
            OB がいいねをすると、マイページで確認できます。
          </p>
          <Link href="/mypage" className="mt-6 inline-block text-sm font-medium text-teal-700 underline">
            マイページへ
          </Link>
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
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold text-stone-800">研修医登録</h1>
      <p className="mt-1 text-xs text-stone-500">研修制度50周年記念式典 — 師匠マッチング</p>

      {!agreed ? (
        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">ご利用にあたって</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-stone-700">
            <li>本アンケートは記名式です。</li>
            <li>実名は実行委員のみが保持し、OB にはニックネームのみが共有されます。</li>
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
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
          )}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-800">基本情報</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-600">姓（実名）</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600">名（実名）</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">ニックネーム（OB に公開）</label>
              <input
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={nick}
                onChange={(e) => {
                  setNick(e.target.value);
                  setNickOk(null);
                }}
                onBlur={() => checkNick(nick)}
              />
              {nickOk === false && <p className="mt-1 text-xs text-red-600">このニックネームは既に使われています</p>}
              {nickOk === true && <p className="mt-1 text-xs text-teal-700">利用可能です</p>}
            </div>
            <fieldset>
              <legend className="text-xs font-medium text-stone-600">研修年次</legend>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="year" value="1" checked={year === "1"} onChange={() => setYear("1")} />
                  1年目
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="year" value="2" checked={year === "2"} onChange={() => setYear("2")} />
                  2年目
                </label>
              </div>
            </fieldset>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-800">興味のある診療科 Top3</h2>
            <div>
              <label className="text-xs font-medium text-stone-600">1位</label>
              <select
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={spec1}
                onChange={(e) => {
                  setSpec1(e.target.value);
                  setSpec2("");
                  setSpec3("");
                }}
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
              <label className="text-xs font-medium text-stone-600">2位</label>
              <select
                required
                disabled={!spec1}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:bg-stone-100"
                value={spec2}
                onChange={(e) => {
                  setSpec2(e.target.value);
                  setSpec3("");
                }}
              >
                <option value="">選択してください</option>
                {opts2.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">3位</label>
              <select
                required
                disabled={!spec2}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:bg-stone-100"
                value={spec3}
                onChange={(e) => setSpec3(e.target.value)}
              >
                <option value="">選択してください</option>
                {opts3.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-semibold text-stone-800">こんな師匠に出会いたい（任意・300字以内）</label>
            <textarea
              maxLength={300}
              rows={4}
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={mentor}
              onChange={(e) => setMentor(e.target.value)}
            />
            <p className="mt-1 text-right text-xs text-stone-400">{mentor.length} / 300</p>
          </section>

          <button
            type="submit"
            disabled={submitting || nickOk === false || !year}
            className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "送信中…" : "登録する"}
          </button>
        </form>
      )}

      <p className="mt-10 text-center">
        <Link href="/" className="text-sm text-stone-500 underline">
          トップへ
        </Link>
      </p>
    </main>
  );
}
