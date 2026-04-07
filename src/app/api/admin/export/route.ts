import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { dbAdminExport } from "@/lib/db";
import { CSV_BOM, toCsvRow } from "@/lib/csv";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "jrs";
  if (type !== "jrs" && type !== "obs" && type !== "matching") {
    return NextResponse.json({ error: "type が不正です" }, { status: 400 });
  }

  try {
    const { jrs, obs, likes } = await dbAdminExport();
    const obById = new Map(obs.map((o) => [o.id, o]));
    const jrById = new Map(jrs.map((j) => [j.id, j]));

    const lines: string[] = [];

    if (type === "jrs") {
      lines.push(
        toCsvRow(["姓", "名", "ニックネーム", "年次", "診療科1位", "診療科2位", "診療科3位", "師匠像", "いいね数", "いいねしたOB"])
      );
      const countByJr = new Map<string, number>();
      const obNamesByJr = new Map<string, string[]>();
      for (const l of likes) {
        countByJr.set(l.jr_id, (countByJr.get(l.jr_id) ?? 0) + 1);
        const o = obById.get(l.ob_id);
        const name = o ? `${o.last} ${o.first}` : l.ob_id;
        const arr = obNamesByJr.get(l.jr_id) ?? [];
        arr.push(name);
        obNamesByJr.set(l.jr_id, arr);
      }
      for (const j of jrs) {
        lines.push(
          toCsvRow([
            j.last,
            j.first,
            j.nick,
            j.year,
            j.spec1,
            j.spec2,
            j.spec3,
            j.mentor ?? "",
            String(countByJr.get(j.id) ?? 0),
            (obNamesByJr.get(j.id) ?? []).join("、"),
          ])
        );
      }
    } else if (type === "obs") {
      lines.push(toCsvRow(["姓", "名", "専門科", "ひとこと", "いいね数", "いいねしたJRニックネーム"]));
      const countByOb = new Map<string, number>();
      const nicksByOb = new Map<string, string[]>();
      for (const l of likes) {
        countByOb.set(l.ob_id, (countByOb.get(l.ob_id) ?? 0) + 1);
        const jr = jrById.get(l.jr_id);
        const nick = jr?.nick ?? l.jr_id;
        const arr = nicksByOb.get(l.ob_id) ?? [];
        arr.push(nick);
        nicksByOb.set(l.ob_id, arr);
      }
      for (const o of obs) {
        lines.push(
          toCsvRow([
            o.last,
            o.first,
            o.spec,
            o.msg ?? "",
            String(countByOb.get(o.id) ?? 0),
            (nicksByOb.get(o.id) ?? []).join("、"),
          ])
        );
      }
    } else {
      lines.push(toCsvRow(["ニックネーム", "年次", "いいねをくれたOB一覧"]));
      const jrIdsWithLikes = new Set(likes.map((l) => l.jr_id));
      for (const j of jrs) {
        if (!jrIdsWithLikes.has(j.id)) continue;
        const obsForJr = likes
          .filter((l) => l.jr_id === j.id)
          .map((l) => {
            const o = obById.get(l.ob_id);
            return o ? `${o.last} ${o.first}（${o.spec}）` : l.ob_id;
          });
        lines.push(toCsvRow([j.nick, j.year, obsForJr.join(" / ")]));
      }
    }

    const body = CSV_BOM + lines.join("\r\n");
    const filename = type === "jrs" ? "jrs.csv" : type === "obs" ? "obs.csv" : "matching.csv";

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "出力に失敗しました" }, { status: 500 });
  }
}
