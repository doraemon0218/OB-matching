import Link from "next/link";

const links = [
  { href: "/jr", label: "研修医登録", desc: "アンケート・同意" },
  { href: "/ob", label: "OB 登録・一覧", desc: "プロフィール登録といいね" },
  { href: "/mypage", label: "研修医マイページ", desc: "ニックネームでログイン" },
  { href: "/admin", label: "実行委員", desc: "統計・CSV" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-bold text-stone-800">師匠マッチング</h1>
      <p className="mt-2 text-sm text-stone-600">研修制度50周年記念式典 — 入口一覧</p>
      <ul className="mt-10 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm transition hover:border-teal-300 hover:shadow"
            >
              <span className="font-semibold text-stone-800">{l.label}</span>
              <span className="mt-1 block text-xs text-stone-500">{l.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-center text-xs text-stone-400">
        登録できないとき:{" "}
        <a href="/api/health" className="underline">
          サーバー状態
        </a>
      </p>
    </main>
  );
}
