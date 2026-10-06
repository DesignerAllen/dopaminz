import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { SESSION_COOKIE as COOKIE, VIEWER_TTL_SEC } from "./session-config";

export type Session = {
  /** settings.session_version — 뷰어 비밀번호가 바뀌면 기존 세션 무효 */
  ver: number;
  /** 관리자 인증. 무활동 만료 없이 세션(7일, 접속 시 갱신)이 살아 있는 동안 유지되고 [관리자 로그아웃]으로만 해제된다 */
  admin?: boolean;
  /** [모드 종료]로 관리자 화면만 끈 상태. 관리자 인증은 남아 있어 다시 들어갈 때 비밀번호를 묻지 않는다 */
  adminOff?: boolean;
};

/** 토큰의 관리자 인증 여부. 예전 토큰(adminUntil: 30분 만료 시각)은 아직 유효하면 관리자로 이어 준다 */
export const adminClaim = (p: Record<string, unknown>) =>
  p.admin === true || (typeof p.adminUntil === "number" && p.adminUntil > Date.now());

/** 토큰에 실을 관리자 필드(관리자가 아니면 비워 둔다) */
export const adminFields = (s: { admin?: unknown; adminOff?: unknown }) =>
  s.admin ? { admin: true, ...(s.adminOff === true ? { adminOff: true } : {}) } : {};

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
    const admin = adminClaim(payload);
    return { ver: payload.ver, admin: admin || undefined, adminOff: (admin && payload.adminOff === true) || undefined };
  } catch {
    return null;
  }
}

export async function writeSession(s: Session) {
  const token = await new SignJWT({ ver: s.ver, ...adminFields(s) })
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

/** 관리자 모드가 켜져 있는지(관리자 화면·API 사용 가능) */
export function isAdmin(s: Session | null) {
  return s?.admin === true && !s.adminOff;
}

/** 관리자 인증이 남아 있는지(모드 종료 상태 포함) */
export function hasAdminAuth(s: Session | null) {
  return s?.admin === true;
}
