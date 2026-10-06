import { NextResponse, type NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { REFRESH_AFTER_SEC, SESSION_COOKIE, VIEWER_TTL_SEC } from "@/lib/session-config";

/** 슬라이딩 세션: 유효한 로그인 상태로 접속하면 만료를 다시 7일 뒤로 밀어준다(관리자 모드도 함께 유지).
 *  (서버 컴포넌트는 쿠키를 쓸 수 없어서 여기서 처리한다. proxy 는 server-only 모듈을 못 써서 관리자 판정을 여기 둔다.) */
export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return res;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    if (typeof payload.ver !== "number") return res;
    // 예전 토큰(adminUntil, 30분 만료)은 바로 새 형식(admin)으로 바꿔 준다
    const legacy = payload.adminUntil !== undefined;
    const age = Math.floor(Date.now() / 1000) - (payload.iat ?? 0);
    if (age < REFRESH_AFTER_SEC && !legacy) return res;
    const admin = payload.admin === true || (typeof payload.adminUntil === "number" && payload.adminUntil > Date.now());
    const fresh = await new SignJWT({ ver: payload.ver, ...(admin ? { admin: true, ...(payload.adminOff === true ? { adminOff: true } : {}) } : {}) })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${VIEWER_TTL_SEC}s`)
      .sign(new TextEncoder().encode(secret));
    res.cookies.set(SESSION_COOKIE, fresh, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: VIEWER_TTL_SEC });
  } catch {
    // 만료·위조된 토큰은 그대로 둔다(각 페이지의 로그인 확인이 처리)
  }
  return res;
}

// 화면(페이지) 요청만. 정적 파일과 API 는 제외
export const config = { matcher: ["/((?!api|_next|logo.svg|favicon.ico).*)"] };
