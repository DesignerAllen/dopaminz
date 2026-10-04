import "server-only";
import { NextResponse } from "next/server";
import { currentVersion } from "./guard";
import { readSession, type Session } from "./session";

/** 크루원(뷰어) API 공통 검문: 유효한 로그인 세션이 없으면 401. (관리자 세션도 뷰어 세션을 포함한다) */
export async function requireViewerApi(): Promise<{ session: Session } | { error: NextResponse }> {
  const s = await readSession();
  if (!s || (await currentVersion()) !== s.ver) {
    return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) };
  }
  return { session: s };
}
