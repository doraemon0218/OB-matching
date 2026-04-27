"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SPECIALTIES } from "@/lib/specialties";

const GRAD_MIN = 1950;
const GRAD_MAX = new Date().getFullYear() + 1;

export default function ObRegisterPage() {
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [spec, setSpec] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [msg, setMsg] = useState("");

  const gradOptions = useMemo(() => {
    const out: string[] = [];
    for (let y = GRAD_MAX; y >= GRAD_MIN; y--) out.push(String(y));
    return out;
  }, []);

  function goStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!last.trim() || !first.trim()) {
      setError("姓・名を入力してください");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上にしてください");
      return;
    }
    if (password !== password2) {
      setError("パスワードが一致しません");
      return;
    }
    setStep(2);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
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
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "登録に失敗しました");
        return;
      }
      setDone(true);
      setPassword("");
      setPassword2("");
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
          <p className="text-lg font-semibold text-teal-900">OB登録が完了しました</p>
          <p className="mt-3 text-sm text-teal-800">ログイン画面からログインして、研修医一覧を閲覧できます。</p>
          <Link href="/ob/mypage" className="mt-6 inline-block text-sm font-medium text-teal-700 underline">
            OBログイン画面へ
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
      <h1 className="text-xl font-bold text-stone-800">OB登録画面</h1>
      <p className="mt-1 text-xs text-stone-500">研修制度50周年記念式典 — 師匠マッチング</p>

      {!agreed ? (
        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">ご利用にあたって</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-stone-700">
            <li>本アンケートは記名式です。</li>
            <li>実名は実行委員のみが保持し、研修医には公開されません。</li>
            <li>データはマッチング目的以外に使用せず、式典終了後に廃棄します。</li>
          </ul>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span className="text-sm text-stone-800">上記を理解し、同意します</span>
          </label>
          <p className="mt-4 text-xs text-stone-500">同意いただけない場合は、式典当日にスタッフへ直接お声がけください。</p>
        </section>
      ) : step === 1 ? (
        <form onSubmit={goStep2} className="mt-8 space-y-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-800">基本情報</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-600">姓（実名）</label>
                <input required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={last} onChange={(e) => setLast(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600">名（実名）</label>
                <input required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={first} onChange={(e) => setFirst(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">パスワード（8文字以上）</label>
              <input type="password" required autoComplete="new-password" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">パスワード（確認）</label>
              <input type="password" required autoComplete="new-password" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={password2} onChange={(e) => setPassword2(e.target.value)} />
            </div>
          </section>
          <button type="submit" className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white">次へ</button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-stone-800">プロフィール</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-600">姓（実名）</label>
                <input required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={last} onChange={(e) => setLast(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600">名（実名）</label>
                <input required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={first} onChange={(e) => setFirst(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">卒業年度</label>
              <select required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={gradYear} onChange={(e) => setGradYear(e.target.value)}>
                <option value="">選択してください</option>
                {gradOptions.map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">専門科</label>
              <select required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={spec} onChange={(e) => setSpec(e.target.value)}>
                <option value="">選択してください</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">所属</label>
              <input required maxLength={200} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">研修医へのメッセージ（任意・200字以内）</label>
              <textarea maxLength={200} rows={3} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={msg} onChange={(e) => setMsg(e.target.value)} />
              <p className="mt-1 text-right text-xs text-stone-400">{msg.length} / 200</p>
            </div>
          </section>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-stone-300 py-3 text-sm font-semibold text-stone-700">戻る</button>
            <button type="submit" disabled={submitting} className="col-span-2 rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "登録中…" : "登録する"}</button>
          </div>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-stone-600">
        既に登録済みの方は <Link href="/ob/mypage" className="text-teal-700 underline">OBログイン画面</Link>
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-stone-500 underline">トップへ</Link>
      </p>
    </main>
  );
}
