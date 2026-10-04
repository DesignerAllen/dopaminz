import { NextResponse } from "next/server";
import { clearSession, readSession, writeSession } from "@/lib/session";

/** body { adminOnly: true } → 관리자 모드만 종료(뷰어 유지). 그 외 → 완전 로그아웃. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { adminOnly?: unknown } | null;
  const session = await readSession();
  if (body?.adminOnly === true && session) await writeSession({ ver: session.ver });
  else await clearSession();
  return NextResponse.json({ ok: true });
}
