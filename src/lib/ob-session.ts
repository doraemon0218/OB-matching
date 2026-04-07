import { cookies } from "next/headers";

const COOKIE = "ob_id";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

export async function setObCookie(obId: string) {
  const store = await cookies();
  store.set(COOKIE, obId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function getObIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export async function clearObCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
