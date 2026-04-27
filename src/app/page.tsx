import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-white px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900">師匠マッチング</h1>
          <p className="mt-2 text-sm text-stone-500">研修制度50周年記念式典</p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm">
            <div className="bg-teal-50 px-5 py-4">
              <p className="text-2xl">🩺</p>
              <h2 className="mt-1 text-lg font-bold text-teal-900">研修医</h2>
              <p className="text-xs text-teal-700">初期研修医の方はこちら</p>
            </div>
            <div className="flex gap-2 p-4">
              <Link
                href="/jr"
                className="flex-1 rounded-xl bg-teal-600 py-3 text-center text-sm font-semibold text-white"
              >
                登録する
              </Link>
              <Link
                href="/mypage"
                className="flex-1 rounded-xl border border-teal-300 py-3 text-center text-sm font-semibold text-teal-800"
              >
                マイページ
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
            <div className="bg-indigo-50 px-5 py-4">
              <p className="text-2xl">👨‍⚕️</p>
              <h2 className="mt-1 text-lg font-bold text-indigo-900">OB・OG</h2>
              <p className="text-xs text-indigo-700">ご参加の先生方はこちら</p>
            </div>
            <div className="flex gap-2 p-4">
              <Link
                href="/ob"
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white"
              >
                登録する
              </Link>
              <Link
                href="/ob/mypage"
                className="flex-1 rounded-xl border border-indigo-300 py-3 text-center text-sm font-semibold text-indigo-800"
              >
                マイページ
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
            <div className="bg-amber-50 px-5 py-4">
              <p className="text-2xl">📋</p>
              <h2 className="mt-1 text-lg font-bold text-amber-900">実行委員</h2>
              <p className="text-xs text-amber-700">統計・データ管理はこちら</p>
            </div>
            <div className="p-4">
              <Link
                href="/admin"
                className="block rounded-xl bg-amber-500 py-3 text-center text-sm font-semibold text-white"
              >
                実行委員画面へ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
