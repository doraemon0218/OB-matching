import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { JrYear } from "@/lib/types";

export type LocalJr = {
  id: string;
  last: string;
  first: string;
  nick: string;
  year: JrYear;
  spec1: string;
  spec2: string;
  spec3: string;
  mentor: string | null;
  created_at: string;
};

export type LocalOb = {
  id: string;
  last: string;
  first: string;
  spec: string;
  msg: string | null;
  created_at: string;
};

export type LocalLike = {
  ob_id: string;
  jr_id: string;
  created_at: string;
  viewed_at: string | null;
};

export type LocalSnapshot = {
  jrs: LocalJr[];
  obs: LocalOb[];
  likes: LocalLike[];
};

/** Vercel などではデプロイ先 FS が読み取り専用のため /tmp を使う（複数インスタンス間では共有されない点に注意） */
function localDbFile(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "ob-matching-local-db.json");
  }
  return path.join(process.cwd(), "data", "local-db.json");
}

let queue: Promise<unknown> = Promise.resolve();

function runLocked<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function readRaw(): Promise<LocalSnapshot> {
  const file = localDbFile();
  try {
    const buf = await readFile(file, "utf8");
    const j = JSON.parse(buf) as LocalSnapshot;
    return {
      jrs: Array.isArray(j.jrs) ? j.jrs : [],
      obs: Array.isArray(j.obs) ? j.obs : [],
      likes: Array.isArray(j.likes) ? j.likes : [],
    };
  } catch {
    return { jrs: [], obs: [], likes: [] };
  }
}

async function writeRaw(data: LocalSnapshot): Promise<void> {
  const file = localDbFile();
  const dir = path.dirname(file);
  await mkdir(dir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  const payload = JSON.stringify(data, null, 2);
  await writeFile(tmp, payload, "utf8");
  await rename(tmp, file);
}

export async function withLocalStore<T>(fn: (snap: LocalSnapshot) => T | Promise<T>): Promise<T> {
  return runLocked(async () => {
    const snap = await readRaw();
    return fn(snap);
  });
}

export async function mutateLocalStore(fn: (snap: LocalSnapshot) => void | Promise<void>): Promise<void> {
  return runLocked(async () => {
    try {
      const snap = await readRaw();
      await fn(snap);
      await writeRaw(snap);
    } catch (e) {
      const err = e as NodeJS.ErrnoException & { code?: string };
      if (err.code === "EROFS" || err.code === "EACCES" || err.code === "EPERM") {
        throw new Error(`${err.code}: read-only or permission denied writing local DB`);
      }
      throw e;
    }
  });
}
