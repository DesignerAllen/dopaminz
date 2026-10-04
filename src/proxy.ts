import { NextResponse, type NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { REFRESH_AFTER_SEC, SESSION_COOKIE, VIEWER_TTL_SEC } from "@/lib/session-config";

/** 슬라이딩 세션: 유효한 로그인 상태로 접속하면 만료를 다시 7일 뒤로 밀어준다.
 *  (서버 컴포넌트는 쿠키를 쓸 수 없어서 여기서 처리한다. 관리자 권한 만료 시각은 건드리지 않는다.) */
export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return res;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    if (typeof payload.ver !== "number") return res;
    const age = Math.floor(Date.now() / 1000) - (payload.iat ?? 0);
    if (age < REFRESH_AFTER_SEC) return res;
    const fresh = await new SignJWT({ ver: payload.ver, adminUntil: payload.adminUntil })
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
