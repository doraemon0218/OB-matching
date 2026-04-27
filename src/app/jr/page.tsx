"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SPECIALTIES } from "@/lib/specialties";
import type { ObForJr } from "@/lib/types";

export default function JrRegisterPage() {
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 基本情報
  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [nick, setNick] = useState("");
  const [nickOk, setNickOk] = useState<boolean | null>(null);
  const [year, setYear] = useState<"1" | "2" | "">("");

  // 希望診療科 Top3
  const [spec1, setSpec1] = useState("");
  const [spec2, setSpec2] = useState("");
  const [spec3, setSpec3] = useState("");
  const opts2 = useMemo(() => SPECIALTIES.filter((s) => s !== spec1), [spec1]);
  const opts3 = useMemo(() => SPECIALTIES.filter((s) => s !== spec1 && s !== spec2), [spec1, spec2]);

  // 希望OB選択
  const [obList, setObList] = useState<ObForJr[]>([]);
  const [obsLoading, setObsLoading] = useState(false);
  const [wantedObIds, setWantedObIds] = useState<Set<string>>(new Set());
  const [obWishSkip, setObWishSkip] = useState(false);

  // こんな師匠に出会いたい
  const [mentor, setMentor] = useState("");

  // 同意後にOBリストを取得
  useEffect(() => {
    if (!agreed) return;
    setObsLoading(true);
    fetch("/api/obs/public")
      .then((r) => r.json())
      .then((j) => setObList(Array.isArray(j.obs) ? (j.obs as ObForJr[]) : []))
      .catch(() => setObList([]))
      .finally(() => setObsLoading(false));
  }, [agreed]);

  async function checkNick(n: string) {
    const t = n.trim();
    if (!t) { setNickOk(null); return; }
    try {
      const res = await fetch(`/api/jr/nick-available?nick=${encodeURIComponent(t)}`);
      const j = (await res.json()) as { available?: boolean };
      setNickOk(typeof j.available === "boolean" ? j.available : null);
    } catch {
      setNickOk(null);
    }
  }

  function toggleOb(id: string) {
    setObWishSkip(false);
    setWantedObIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleNoPreference() {
    setObWishSkip(true);
    setWantedObIds(new Set());
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!year) { setError("研修年次（1年目 / 2年目）を選んでください"); return; }
    if (!spec1 || !spec2 || !spec3) { setError("診療科 Top3 をすべて選んでください"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/jr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          last: last.trim(),
          first: first.trim(),
          nick: nick.trim(),
          year,
          spec1,
          spec2,
          spec3,
          mentor,
          wantedObIds: obWishSkip ? [] : Array.from(wantedObIds),
        }),
      });
      const text = await res.text();
      let j: { error?: string; ok?: boolean };
      try {
        j = text ? JSON.parse(text) : {};
      } catch {
        setError(`サーバー応答が読めません（HTTP ${res.status}）。/api/health を開いて状態を確認してください。`);
        return;
      }
      if (!res.ok) {
        setError(
          typeof j.error === "string" && j.error.trim()
            ? j.error
            : `登録に失敗しました（HTTP ${res.status}）。`
        );
        return;
      }
      setDone(true);
    } catch {
      setError("通信に失敗しました。接続を確認してから再度お試しください。");
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
          <Link href="/" className="text-sm text-stone-500 underline">トップへ</Link>
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
            <li>データはマッチング・進路把握の目的以外に使用せず、式典終了後に廃棄します。</li>
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

          {/* ── 基本情報 ── */}
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
                onChange={(e) => { setNick(e.target.value); setNickOk(null); }}
                onBlur={() => checkNick(nick)}
              />
              {nickOk === false && <p className="mt-1 text-xs text-red-600">このニックネームは既に使われています</p>}
              {nickOk === true && <p className="mt-1 text-xs text-teal-700">利用可能です</p>}
            </div>
            <fieldset>
              <legend className="text-xs font-medium text-stone-600">研修年次（必須）</legend>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="year" value="1" required checked={year === "1"} onChange={() => setYear("1")} />
                  1年目
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="year" value="2" checked={year === "2"} onChange={() => setYear("2")} />
                  2年目
                </label>
              </div>
              {!year && <p className="mt-1 text-xs text-amber-700">どちらかを選ぶと「登録する」ボタンが押せます</p>}
            </fieldset>
          </section>

          {/* ── 希望診療科 Top3 ── */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-800">興味のある診療科 Top3</h2>
            <div>
              <label className="text-xs font-medium text-stone-600">1位</label>
              <select
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={spec1}
                onChange={(e) => { setSpec1(e.target.value); setSpec2(""); setSpec3(""); }}
              >
                <option value="">選択してください</option>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">2位</label>
              <select
                required
                disabled={!spec1}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:bg-stone-100"
                value={spec2}
                onChange={(e) => { setSpec2(e.target.value); setSpec3(""); }}
              >
                <option value="">選択してください</option>
                {opts2.map((s) => <option key={s} value={s}>{s}</option>)}
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
                {opts3.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </section>

          {/* ── お話を希望するOBの先生 ── */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-800">
                お話を希望するOBの先生
                <span className="ml-2 text-xs font-normal text-stone-400">任意・複数選択可</span>
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                式典に参加予定のOB先生の中から、ぜひお話ししてみたい方を選んでください。
                実行委員がマッチングの参考にします。
              </p>
            </div>

            {/* 希望なし */}
            <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              obWishSkip
                ? "border-stone-400 bg-stone-100 font-medium text-stone-700"
                : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
            }`}>
              <input
                type="checkbox"
                checked={obWishSkip}
                onChange={handleNoPreference}
                className="shrink-0"
              />
              特に希望なし
            </label>

            {/* OBリスト */}
            {obsLoading ? (
              <p className="py-4 text-center text-xs text-stone-400">読み込み中…</p>
            ) : obList.length === 0 ? (
              <p className="py-4 text-center text-xs text-stone-400">
                （まだOBの登録がありません。後日ご確認ください）
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {obList.map((ob) => {
                  const selected = wantedObIds.has(ob.id);
                  return (
                    <label
                      key={ob.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                        selected
                          ? "border-teal-400 bg-teal-50"
                          : "border-stone-200 bg-white hover:bg-stone-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 shrink-0"
                        checked={selected}
                        onChange={() => toggleOb(ob.id)}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium text-stone-800">
                            {ob.last} {ob.first} 先生
                          </span>
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-700">
                            {ob.spec}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-stone-500">
                          {ob.affiliation}
                          {ob.grad_year ? `　${ob.grad_year}年卒` : ""}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {wantedObIds.size > 0 && (
              <p className="text-xs text-teal-700">{wantedObIds.size} 名を選択中</p>
            )}
          </section>

          {/* ── こんな師匠に出会いたい ── */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-semibold text-stone-800">
              こんな師匠に出会いたい
              <span className="ml-2 text-xs font-normal text-stone-400">任意・300字以内</span>
            </label>
            <p className="mt-1 text-xs text-stone-500">
              希望する専門分野・スタイル・相談したいことなど、自由にお書きください。
            </p>
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
            disabled={submitting || nickOk === false}
            className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "送信中…" : "登録する"}
          </button>
          {nickOk === false && (
            <p className="mt-2 text-center text-xs text-red-600">別のニックネームにするか、未使用か確認してください</p>
          )}
        </form>
      )}

      <p className="mt-10 text-center">
        <Link href="/" className="text-sm text-stone-500 underline">トップへ</Link>
      </p>
    </main>
  );
}
