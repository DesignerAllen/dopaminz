import { NextResponse } from "next/server";
import { clearSession, readSession, writeSession } from "@/lib/session";

/** body { adminOnly: true } → [모드 종료]: 관리자 화면만 끄고 관리자 인증은 유지(다시 들어갈 때 비밀번호 없음).
 *  body { adminLogout: true } → [관리자 로그아웃]: 관리자 인증을 지운다(뷰어 로그인은 유지, 다시 들어가려면 비밀번호 필요).
 *  그 외 → 완전 로그아웃. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { adminOnly?: unknown; adminLogout?: unknown } | null;
  const session = await readSession();
  if (body?.adminLogout === true && session) await writeSession({ ver: session.ver });
  else if (body?.adminOnly === true && session) await writeSession(session.admin ? { ver: session.ver, admin: true, adminOff: true } : { ver: session.ver });
  else await clearSession();
  return NextResponse.json({ ok: true });
}
