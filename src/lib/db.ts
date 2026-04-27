/**
 * Supabase（本番）またはローカル JSON（開発・オフライン）のデータアクセス。
 */
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { newJrId, newObId } from "@/lib/ids";
import { mutateLocalStore, withLocalStore, type LocalJr, type LocalLike, type LocalJrObWish, type LocalOb } from "@/lib/local-store";
import type { JrPublic, JrYear, ObForJr, ObPublic } from "@/lib/types";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key);
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
      console.error("[dbInsertJr]", error);
      throw new Error(`SUPABASE_INSERT:${error.code ?? "?"}:${error.message}`);
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

function supabaseObToLocal(row: Record<string, unknown>): LocalOb {
  return {
    id: String(row.id),
    last: String(row.last ?? ""),
    first: String(row.first ?? ""),
    password_hash: String(row.password_hash ?? ""),
    grad_year: String(row.grad_year ?? ""),
    spec: String(row.spec ?? ""),
    affiliation: String(row.affiliation ?? ""),
    msg: row.msg != null && row.msg !== "" ? String(row.msg) : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

function stripObPublic(o: LocalOb): ObPublic {
  return {
    id: o.id,
    last: o.last,
    first: o.first,
    grad_year: o.grad_year,
    spec: o.spec,
    affiliation: o.affiliation,
    msg: o.msg,
    created_at: o.created_at,
  };
}

export async function dbGetObFullById(obId: string): Promise<LocalOb | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await sb().from("obs").select("*").eq("id", obId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return supabaseObToLocal(data as Record<string, unknown>);
  }
  return withLocalStore((s) => s.obs.find((o) => o.id === obId) ?? null);
}

/** 公開用（password_hash を含まない） */
export async function dbGetObById(obId: string): Promise<ObPublic | null> {
  const full = await dbGetObFullById(obId);
  return full ? stripObPublic(full) : null;
}

export async function dbFindObByName(last: string, first: string): Promise<LocalOb | null> {
  const L = last.trim();
  const F = first.trim();
  if (!L || !F) return null;
  if (isSupabaseConfigured()) {
    const { data, error } = await sb().from("obs").select("*").eq("last", L).eq("first", F).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return supabaseObToLocal(data as Record<string, unknown>);
  }
  return withLocalStore((s) => s.obs.find((o) => o.last === L && o.first === F) ?? null);
}

export async function dbObNameTaken(last: string, first: string, excludeObId?: string): Promise<boolean> {
  const L = last.trim();
  const F = first.trim();
  if (!L || !F) return false;
  if (isSupabaseConfigured()) {
    const { data, error } = await sb().from("obs").select("id").eq("last", L).eq("first", F).maybeSingle();
    if (error) throw error;
    if (!data) return false;
    return excludeObId ? data.id !== excludeObId : true;
  }
  return withLocalStore((s) => s.obs.some((o) => o.last === L && o.first === F && o.id !== excludeObId));
}

export async function dbInsertOb(
  row: Omit<LocalOb, "id" | "created_at"> & { id?: string }
): Promise<{ ok: true; id: string } | { ok: false; duplicateName: true }> {
  const id = row.id ?? newObId();
  const created_at = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const { error } = await sb().from("obs").insert({
      id,
      last: row.last.trim(),
      first: row.first.trim(),
      password_hash: row.password_hash,
      grad_year: row.grad_year,
      spec: row.spec,
      affiliation: row.affiliation,
      msg: row.msg,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, duplicateName: true };
      console.error("[dbInsertOb]", error);
      throw new Error(`SUPABASE_INSERT:${error.code ?? "?"}:${error.message}`);
    }
    return { ok: true, id };
  }
  let dup = false;
  await mutateLocalStore((s) => {
    if (s.obs.some((o) => o.last === row.last.trim() && o.first === row.first.trim())) {
      dup = true;
      return;
    }
    s.obs.push({
      id,
      last: row.last.trim(),
      first: row.first.trim(),
      password_hash: row.password_hash,
      grad_year: row.grad_year,
      spec: row.spec,
      affiliation: row.affiliation,
      msg: row.msg,
      created_at,
    });
  });
  if (dup) return { ok: false, duplicateName: true };
  return { ok: true, id };
}

export async function dbUpdateObProfile(
  obId: string,
  patch: Pick<LocalOb, "last" | "first" | "grad_year" | "spec" | "affiliation" | "msg">
): Promise<{ ok: true } | { ok: false; notFound: true } | { ok: false; duplicateName: true }> {
  const last = patch.last.trim();
  const first = patch.first.trim();
  if (isSupabaseConfigured()) {
    const existing = await dbGetObFullById(obId);
    if (!existing) return { ok: false, notFound: true };
    const taken = await dbObNameTaken(last, first, obId);
    if (taken) return { ok: false, duplicateName: true };
    const { error } = await sb()
      .from("obs")
      .update({
        last,
        first,
        grad_year: patch.grad_year,
        spec: patch.spec,
        affiliation: patch.affiliation,
        msg: patch.msg,
      })
      .eq("id", obId);
    if (error) {
      if (error.code === "23505") return { ok: false, duplicateName: true };
      throw error;
    }
    return { ok: true };
  }
  let result: { ok: true } | { ok: false; notFound: true } | { ok: false; duplicateName: true } = {
    ok: false,
    notFound: true,
  };
  await mutateLocalStore((s) => {
    const idx = s.obs.findIndex((o) => o.id === obId);
    if (idx < 0) {
      result = { ok: false, notFound: true };
      return;
    }
    if (s.obs.some((o) => o.id !== obId && o.last === last && o.first === first)) {
      result = { ok: false, duplicateName: true };
      return;
    }
    const o = s.obs[idx]!;
    o.last = last;
    o.first = first;
    o.grad_year = patch.grad_year;
    o.spec = patch.spec;
    o.affiliation = patch.affiliation;
    o.msg = patch.msg;
    result = { ok: true };
  });
  return result;
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

export async function dbListObsForJr(nick: string): Promise<ObPublic[] | null> {
  const n = nick.trim();
  if (!n) return null;
  if (isSupabaseConfigured()) {
    const { data: jr, error: jrErr } = await sb().from("jrs").select("id").eq("nick", n).maybeSingle();
    if (jrErr) throw jrErr;
    if (!jr) return null;
    const { data: obs, error: obErr } = await sb()
      .from("obs")
      .select("id, last, first, grad_year, spec, affiliation, msg, created_at")
      .order("created_at", { ascending: true });
    if (obErr) throw obErr;
    return (obs ?? []) as ObPublic[];
  }
  return withLocalStore((s) => {
    const jr = s.jrs.find((j) => j.nick === n);
    if (!jr) return null;
    return [...s.obs]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((o) => ({
        id: o.id,
        last: o.last,
        first: o.first,
        grad_year: o.grad_year,
        spec: o.spec,
        affiliation: o.affiliation,
        msg: o.msg,
        created_at: o.created_at,
      }));
  });
}

/** 研修医登録フォーム向け：全OBの公開情報（認証不要） */
export async function dbListAllObsPublic(): Promise<ObForJr[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await sb()
      .from("obs")
      .select("id, last, first, spec, affiliation, grad_year")
      .order("grad_year", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((o) => ({
      id: String(o.id),
      last: String(o.last ?? ""),
      first: String(o.first ?? ""),
      spec: String(o.spec ?? ""),
      affiliation: String(o.affiliation ?? ""),
      grad_year: String(o.grad_year ?? ""),
    }));
  }
  return withLocalStore((s) =>
    [...s.obs]
      .sort((a, b) => a.grad_year.localeCompare(b.grad_year))
      .map((o) => ({
        id: o.id,
        last: o.last,
        first: o.first,
        spec: o.spec,
        affiliation: o.affiliation,
        grad_year: o.grad_year,
      }))
  );
}

/** 研修医が希望するOBをまとめて登録（obIds が空なら何もしない = 希望なし） */
export async function dbInsertJrObWishes(jrId: string, obIds: string[]): Promise<void> {
  if (!obIds.length) return;
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const rows = obIds.map((ob_id) => ({ jr_id: jrId, ob_id, created_at: now }));
    const { error } = await sb().from("jr_ob_wishes").insert(rows);
    if (error) {
      console.error("[dbInsertJrObWishes]", error);
      throw new Error(`SUPABASE_INSERT:${error.code ?? "?"}:${error.message}`);
    }
    return;
  }
  await mutateLocalStore((s) => {
    if (!s.wishes) s.wishes = [];
    for (const ob_id of obIds) {
      if (!s.wishes.some((w: LocalJrObWish) => w.jr_id === jrId && w.ob_id === ob_id)) {
        s.wishes.push({ jr_id: jrId, ob_id, created_at: now });
      }
    }
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
      grad_year: o.grad_year,
      spec: o.spec,
      affiliation: o.affiliation,
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
