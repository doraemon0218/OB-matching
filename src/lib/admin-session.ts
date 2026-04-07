import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const COOKIE = "admin_session";
const MAX_AGE_SEC = 60 * 60 * 12;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "development") {
    return "dev-only-admin-session-secret-ob-matching-32chars";
  }
  throw new Error("ADMIN_SESSION_SECRET を16文字以上で .env.local に設定してください。");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createAdminSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const body = `admin:${exp}`;
  const sig = sign(body);
  return Buffer.from(`${body}:${sig}`, "utf8").toString("base64url");
}

export function verifyAdminSessionToken(token: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = raw.lastIndexOf(":");
    if (lastColon <= 0) return false;
    const body = raw.slice(0, lastColon);
    const sig = raw.slice(lastColon + 1);
    const expected = sign(body);
    if (sig.length !== expected.length) return false;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const parts = body.split(":");
    if (parts.length !== 2 || parts[0] !== "admin") return false;
    const exp = Number(parts[1]);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function applyAdminSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return res;
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const v = store.get(COOKIE)?.value;
  if (!v) return false;
  return verifyAdminSessionToken(v);
}
