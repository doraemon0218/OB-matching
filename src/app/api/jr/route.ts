import { NextResponse } from "next/server";
import { dbInsertJr } from "@/lib/db";
import { newJrId } from "@/lib/ids";
import { registrationErrorMessage } from "@/lib/register-errors";
import { SPECIALTIES } from "@/lib/specialties";
import type { JrYear } from "@/lib/types";

export const runtime = "nodejs";

const specSet = new Set(SPECIALTIES);

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("JSON が不正です");
  }
  if (!body || typeof body !== "object") return bad("リクエストが不正です");

  const b = body as Record<string, unknown>;
  const last = String(b.last ?? "").trim();
  const first = String(b.first ?? "").trim();
  const nick = String(b.nick ?? "").trim();
  const year = b.year as string;
  const spec1 = String(b.spec1 ?? "").trim();
  const spec2 = String(b.spec2 ?? "").trim();
  const spec3 = String(b.spec3 ?? "").trim();
  const mentorRaw = b.mentor != null ? String(b.mentor) : "";
  const mentor = mentorRaw.trim() || null;

  if (!last || !first || !nick) return bad("姓・名・ニックネームは必須です");
  if (year !== "1" && year !== "2") return bad("研修年次を選択してください");
  if (!spec1 || !spec2 || !spec3) return bad("診療科 Top3 をすべて選択してください");
  if (spec1 === spec2 || spec2 === spec3 || spec1 === spec3) {
    return bad("同じ診療科は選べません");
  }
  for (const s of [spec1, spec2, spec3]) {
    if (!specSet.has(s)) return bad("診療科の値が不正です");
  }
  if (mentor && mentor.length > 300) return bad("「こんな師匠に出会いたい」は300文字以内にしてください");

  try {
    const id = newJrId();
    const res = await dbInsertJr({
      id,
      last,
      first,
      nick,
      year: year as JrYear,
      spec1,
      spec2,
      spec3,
      mentor,
    });
    if (!res.ok) {
      if (res.duplicateNick) return bad("このニックネームは既に使われています", 409);
      return NextResponse.json({ error: "登録を完了できませんでした。" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: res.id });
  } catch (e) {
    console.error("[POST /api/jr]", e);
    return NextResponse.json({ error: registrationErrorMessage(e) }, { status: 500 });
  }
}
