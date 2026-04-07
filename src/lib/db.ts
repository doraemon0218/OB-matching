/**
 * Supabase（本番）またはローカル JSON（開発・オフライン）のデータアクセス。
 */
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { newJrId, newObId } from "@/lib/ids";
import { mutateLocalStore, withLocalStore, type LocalJr, type LocalLike, type LocalOb } from "@/lib/local-store";
import type { JrPublic, JrYear } from "@/lib/types";

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

function sb(): SupabaseClient {
  return getSupabaseAdmin();
}

export async function dbInsertJr(row: Omit<LocalJr, "id" | "created_at"> & { id?: string }): Promise<
  { ok: true; id: string } | { ok: false; duplicateNick: boolean }
> {
  const id = row.id ?? newJrId();
  const created_at = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const { error } = await sb().from("jrs").insert({
      id,
      last: row.last,
      first: row.first,
      nick: row.nick,
      year: row.year,
      spec1: row.spec1,
      spec2: row.spec2,
      spec3: row.spec3,
      mentor: row.mentor,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, duplicateNick: true };
      console.error(error);
      throw new Error("insert jr");
    }
    return { ok: true, id };
  }
  let dup = false;
  await mutateLocalStore((s) => {
    if (s.jrs.some((j) => j.nick === row.nick)) {
      dup = true;
      return;
    }
    s.jrs.push({
      id,
      last: row.last,
      first: row.first,
      nick: row.nick,
      year: row.year,
      spec1: row.spec1,
      spec2: row.spec2,
      spec3: row.spec3,
      mentor: row.mentor,
      created_at,
    });
  });
  if (dup) return { ok: false, duplicateNick: true };
  return { ok: true, id };
}

export async function dbNickAvailable(nick: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { data, error } = await sb().from("jrs").select("id").eq("nick", nick).maybeSingle();
    if (error) throw error;
    return !data;
  }
  return withLocalStore((s) => !s.jrs.some((j) => j.nick === nick));
}

export async function dbInsertOb(row: Omit<LocalOb, "id" | "created_at"> & { id?: string }): Promise<string> {
  const id = row.id ?? newObId();
  const created_at = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const { error } = await sb().from("obs").insert({
      id,
      last: row.last,
      first: row.first,
      spec: row.spec,
      msg: row.msg,
    });
    if (error) {
      console.error(error);
      throw new Error("insert ob");
    }
    return id;
  }
  await mutateLocalStore((s) => {
    s.obs.push({
      id,
      last: row.last,
      first: row.first,
      spec: row.spec,
      msg: row.msg,
      created_at,
    });
  });
  return id;
}

export async function dbGetObById(obId: string): Promise<LocalOb | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await sb()
      .from("obs")
      .select("id, last, first, spec, msg, created_at")
      .eq("id", obId)
      .maybeSingle();
    if (error) throw error;
    return data as LocalOb | null;
  }
  return withLocalStore((s) => s.obs.find((o) => o.id === obId) ?? null);
}

export type JrListFilters = { spec: string | "all" };

function toJrPublic(
  r: { id: string; nick: string; year: string; spec1: string; spec2: string; spec3: string; mentor: string | null },
  likes: { jr_id: string; ob_id: string }[],
  obId: string
): JrPublic {
  const countByJr = new Map<string, number>();
  for (const l of likes) {
    countByJr.set(l.jr_id, (countByJr.get(l.jr_id) ?? 0) + 1);
  }
  return {
    id: r.id,
    nick: r.nick,
    year: r.year as JrYear,
    specs: [r.spec1, r.spec2, r.spec3],
    mentor: r.mentor,
    likeCount: countByJr.get(r.id) ?? 0,
    likedByMe: likes.some((l) => l.jr_id === r.id && l.ob_id === obId),
  };
}

export async function dbListJrsForOb(obId: string, filters: JrListFilters): Promise<JrPublic[] | null> {
  if (isSupabaseConfigured()) {
    const { data: obRow, error: obErr } = await sb().from("obs").select("id").eq("id", obId).maybeSingle();
    if (obErr) throw obErr;
    if (!obRow) return null;

    const { data: jrs, error: jrErr } = await sb()
      .from("jrs")
      .select("id, nick, year, spec1, spec2, spec3, mentor, created_at")
      .order("created_at", { ascending: true });
    if (jrErr) throw jrErr;

    const { data: likes, error: likeErr } = await sb().from("likes").select("jr_id, ob_id");
    if (likeErr) throw likeErr;

    let rows: JrPublic[] = (jrs ?? []).map((r) => toJrPublic(r, likes ?? [], obId));
    if (filters.spec !== "all") {
      rows = rows.filter((r) => r.specs.includes(filters.spec));
    }
    return rows;
  }

  const ob = await withLocalStore((s) => s.obs.find((o) => o.id === obId));
  if (!ob) return null;

  return withLocalStore((s) => {
    const likes = s.likes.map((l) => ({ jr_id: l.jr_id, ob_id: l.ob_id }));
    const sorted = [...s.jrs].sort((a, b) => a.created_at.localeCompare(b.created_at));
    let rows: JrPublic[] = sorted.map((r) => toJrPublic(r, likes, obId));
    if (filters.spec !== "all") {
      rows = rows.filter((r) => r.specs.includes(filters.spec));
    }
    return rows;
  });
}

export async function dbToggleLike(obId: string, jrId: string): Promise<{ liked: boolean } | "no_jr" | "no_ob"> {
  if (isSupabaseConfigured()) {
    const { data: jr } = await sb().from("jrs").select("id").eq("id", jrId).maybeSingle();
    if (!jr) return "no_jr";

    const { data: existing } = await sb()
      .from("likes")
      .select("ob_id")
      .eq("ob_id", obId)
      .eq("jr_id", jrId)
      .maybeSingle();

    if (existing) {
      const { error } = await sb().from("likes").delete().eq("ob_id", obId).eq("jr_id", jrId);
      if (error) throw error;
      return { liked: false };
    }
    const { error } = await sb().from("likes").insert({ ob_id: obId, jr_id: jrId });
    if (error) throw error;
    return { liked: true };
  }

  let result: { liked: boolean } | "no_jr" | "no_ob" = "no_jr";
  await mutateLocalStore((s) => {
    if (!s.obs.some((o) => o.id === obId)) {
      result = "no_ob";
      return;
    }
    if (!s.jrs.some((j) => j.id === jrId)) {
      result = "no_jr";
      return;
    }
    const idx = s.likes.findIndex((l) => l.ob_id === obId && l.jr_id === jrId);
    if (idx >= 0) {
      s.likes.splice(idx, 1);
      result = { liked: false };
    } else {
      s.likes.push({
        ob_id: obId,
        jr_id: jrId,
        created_at: new Date().toISOString(),
        viewed_at: null,
      });
      result = { liked: true };
    }
  });
  return result;
}

export async function dbGetMypage(nick: string): Promise<
  | {
      jr: { nick: string; year: JrYear; specs: [string, string, string]; mentor: string | null };
      likes: {
        obId: string;
        name: string;
        spec: string;
        msg: string | null;
        createdAt: string;
        isNew: boolean;
      }[];
    }
  | null
> {
  if (isSupabaseConfigured()) {
    const supabase = sb();
    const { data: jr, error: jrErr } = await supabase
      .from("jrs")
      .select("id, nick, year, spec1, spec2, spec3, mentor")
      .eq("nick", nick)
      .maybeSingle();
    if (jrErr) throw jrErr;
    if (!jr) return null;

    const { data: likeRows, error: lErr } = await supabase
      .from("likes")
      .select("ob_id, created_at, viewed_at")
      .eq("jr_id", jr.id)
      .order("created_at", { ascending: false });
    if (lErr) throw lErr;

    const obIds = [...new Set((likeRows ?? []).map((l) => l.ob_id))];
    let obMap = new Map<string, { last: string; first: string; spec: string; msg: string | null }>();
    if (obIds.length > 0) {
      const { data: obs, error: oErr } = await supabase.from("obs").select("id, last, first, spec, msg").in("id", obIds);
      if (oErr) throw oErr;
      obMap = new Map((obs ?? []).map((o) => [o.id, { last: o.last, first: o.first, spec: o.spec, msg: o.msg }]));
    }

    const likes = (likeRows ?? []).map((l) => {
      const ob = obMap.get(l.ob_id);
      const name = ob ? `${ob.last} ${ob.first}` : "(不明)";
      return {
        obId: l.ob_id,
        name,
        spec: ob?.spec ?? "",
        msg: ob?.msg ?? null,
        createdAt: l.created_at,
        isNew: l.viewed_at == null,
      };
    });

    return {
      jr: {
        nick: jr.nick,
        year: jr.year as JrYear,
        specs: [jr.spec1, jr.spec2, jr.spec3],
        mentor: jr.mentor,
      },
      likes,
    };
  }

  return withLocalStore((s) => {
    const jr = s.jrs.find((j) => j.nick === nick);
    if (!jr) return null;
    const likeRows = s.likes
      .filter((l) => l.jr_id === jr.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const obMap = new Map(s.obs.map((o) => [o.id, o]));
    const likes = likeRows.map((l) => {
      const ob = obMap.get(l.ob_id);
      const name = ob ? `${ob.last} ${ob.first}` : "(不明)";
      return {
        obId: l.ob_id,
        name,
        spec: ob?.spec ?? "",
        msg: ob?.msg ?? null,
        createdAt: l.created_at,
        isNew: l.viewed_at == null,
      };
    });
    return {
      jr: {
        nick: jr.nick,
        year: jr.year,
        specs: [jr.spec1, jr.spec2, jr.spec3],
        mentor: jr.mentor,
      },
      likes,
    };
  });
}

export async function dbMarkMypageViewed(nick: string): Promise<boolean> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const supabase = sb();
    const { data: jr, error: jrErr } = await supabase.from("jrs").select("id").eq("nick", nick).maybeSingle();
    if (jrErr) throw jrErr;
    if (!jr) return false;
    const { error } = await supabase
      .from("likes")
      .update({ viewed_at: now })
      .eq("jr_id", jr.id)
      .is("viewed_at", null);
    if (error) throw error;
    return true;
  }
  let updated = false;
  await mutateLocalStore((s) => {
    const jr = s.jrs.find((j) => j.nick === nick);
    if (!jr) return;
    updated = true;
    for (const l of s.likes) {
      if (l.jr_id === jr.id && l.viewed_at == null) l.viewed_at = now;
    }
  });
  return updated;
}

export type AdminStats = {
  jrCount: number;
  obCount: number;
  likeCount: number;
  jrsWithLikes: number;
};

export async function dbAdminStats(): Promise<AdminStats> {
  if (isSupabaseConfigured()) {
    const supabase = sb();
    const [{ count: jrCount }, { count: obCount }, { count: likeCount }, { data: likesForJr }] = await Promise.all([
      supabase.from("jrs").select("*", { count: "exact", head: true }),
      supabase.from("obs").select("*", { count: "exact", head: true }),
      supabase.from("likes").select("*", { count: "exact", head: true }),
      supabase.from("likes").select("jr_id"),
    ]);
    const distinctJr = new Set((likesForJr ?? []).map((l) => l.jr_id));
    return {
      jrCount: jrCount ?? 0,
      obCount: obCount ?? 0,
      likeCount: likeCount ?? 0,
      jrsWithLikes: distinctJr.size,
    };
  }
  return withLocalStore((s) => ({
    jrCount: s.jrs.length,
    obCount: s.obs.length,
    likeCount: s.likes.length,
    jrsWithLikes: new Set(s.likes.map((l) => l.jr_id)).size,
  }));
}

export type AdminTab = "jrs" | "obs" | "matching";

export async function dbAdminTable(tab: AdminTab): Promise<Record<string, unknown>[]> {
  if (isSupabaseConfigured()) {
    const supabase = sb();
    const [{ data: jrs }, { data: obs }, { data: likes }] = await Promise.all([
      supabase.from("jrs").select("*").order("created_at", { ascending: true }),
      supabase.from("obs").select("*").order("created_at", { ascending: true }),
      supabase.from("likes").select("ob_id, jr_id, created_at, viewed_at"),
    ]);
    return buildAdminRows(tab, jrs ?? [], obs ?? [], likes ?? []);
  }
  return withLocalStore((s) => {
    const likes: LocalLike[] = s.likes;
    const jrs: LocalJr[] = [...s.jrs].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const obs: LocalOb[] = [...s.obs].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return buildAdminRows(tab, jrs, obs, likes);
  });
}

function buildAdminRows(
  tab: AdminTab,
  jrs: LocalJr[],
  obs: LocalOb[],
  likes: { ob_id: string; jr_id: string }[]
): Record<string, unknown>[] {
  const obById = new Map(obs.map((o) => [o.id, o]));
  const jrById = new Map(jrs.map((j) => [j.id, j]));

  if (tab === "jrs") {
    const obNamesByJr = new Map<string, string[]>();
    const countByJr = new Map<string, number>();
    for (const l of likes) {
      countByJr.set(l.jr_id, (countByJr.get(l.jr_id) ?? 0) + 1);
      const o = obById.get(l.ob_id);
      const name = o ? `${o.last} ${o.first}` : l.ob_id;
      const arr = obNamesByJr.get(l.jr_id) ?? [];
      arr.push(name);
      obNamesByJr.set(l.jr_id, arr);
    }
    return jrs.map((j) => ({
      id: j.id,
      last: j.last,
      first: j.first,
      nick: j.nick,
      year: j.year,
      spec1: j.spec1,
      spec2: j.spec2,
      spec3: j.spec3,
      mentor: j.mentor,
      likeCount: countByJr.get(j.id) ?? 0,
      obNames: (obNamesByJr.get(j.id) ?? []).join("、"),
    }));
  }

  if (tab === "obs") {
    const jrNicksByOb = new Map<string, string[]>();
    const countByOb = new Map<string, number>();
    for (const l of likes) {
      countByOb.set(l.ob_id, (countByOb.get(l.ob_id) ?? 0) + 1);
      const j = jrById.get(l.jr_id);
      const nick = j?.nick ?? l.jr_id;
      const arr = jrNicksByOb.get(l.ob_id) ?? [];
      arr.push(nick);
      jrNicksByOb.set(l.ob_id, arr);
    }
    return obs.map((o) => ({
      id: o.id,
      last: o.last,
      first: o.first,
      spec: o.spec,
      msg: o.msg,
      likeCount: countByOb.get(o.id) ?? 0,
      jrNicks: (jrNicksByOb.get(o.id) ?? []).join("、"),
    }));
  }

  const jrIdsWithLikes = new Set(likes.map((l) => l.jr_id));
  return jrs
    .filter((j) => jrIdsWithLikes.has(j.id))
    .map((j) => {
      const obsForJr = likes
        .filter((l) => l.jr_id === j.id)
        .map((l) => {
          const o = obById.get(l.ob_id);
          return o ? `${o.last} ${o.first}（${o.spec}）` : l.ob_id;
        });
      return {
        nick: j.nick,
        year: j.year,
        obList: obsForJr,
        obSummary: obsForJr.join(" / "),
      };
    });
}

export async function dbAdminExport(): Promise<{
  jrs: LocalJr[];
  obs: LocalOb[];
  likes: { ob_id: string; jr_id: string }[];
}> {
  if (isSupabaseConfigured()) {
    const supabase = sb();
    const [{ data: jrs }, { data: obs }, { data: likes }] = await Promise.all([
      supabase.from("jrs").select("*").order("created_at", { ascending: true }),
      supabase.from("obs").select("*").order("created_at", { ascending: true }),
      supabase.from("likes").select("ob_id, jr_id"),
    ]);
    return {
      jrs: (jrs ?? []) as LocalJr[],
      obs: (obs ?? []) as LocalOb[],
      likes: likes ?? [],
    };
  }
  return withLocalStore((s) => ({
    jrs: [...s.jrs].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    obs: [...s.obs].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    likes: s.likes.map((l) => ({ ob_id: l.ob_id, jr_id: l.jr_id })),
  }));
}
