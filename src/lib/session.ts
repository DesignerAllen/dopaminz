import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { SESSION_COOKIE as COOKIE, VIEWER_TTL_SEC } from "./session-config";

export const ADMIN_IDLE_MS = 30 * 60 * 1000; // 관리자 30분 무활동 시 뷰어로 복귀

export type Session = {
  /** settings.session_version — 뷰어 비밀번호가 바뀌면 기존 세션 무효 */
  ver: number;
  /** 관리자 권한 만료 시각(ms). 없거나 지났으면 뷰어 */
  adminUntil?: number;
};

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET 은 32자 이상이어야 합니다");
  return new TextEncoder().encode(s);
}

export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.ver !== "number") return null;
    return { ver: payload.ver, adminUntil: typeof payload.adminUntil === "number" ? payload.adminUntil : undefined };
  } catch {
    return null;
  }
}

export async function writeSession(s: Session) {
  const token = await new SignJWT({ ver: s.ver, adminUntil: s.adminUntil })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${VIEWER_TTL_SEC}s`)
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VIEWER_TTL_SEC,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export function isAdmin(s: Session | null) {
  return !!s?.adminUntil && s.adminUntil > Date.now();
}
