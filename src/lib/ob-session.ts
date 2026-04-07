import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const COOKIE = "ob_id";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SEC,
};

/**
 * Route Handler では cookies().set だけだと Set-Cookie が付かないことがあるため、
 * 返す NextResponse に直接付与する。
 */
export function applyObCookie(res: NextResponse, obId: string): NextResponse {
  res.cookies.set(COOKIE, obId, cookieOpts);
  return res;
}

export async function getObIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export async function clearObCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
