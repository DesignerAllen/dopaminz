import { NextResponse } from "next/server";
import { ADMIN_IDLE_MS, isAdmin, readSession, writeSession } from "@/lib/session";

/** 관리자 활동 신호: 30분 무활동 타이머를 연장한다. */
export async function POST() {
  const s = await readSession();
  if (!s || !isAdmin(s)) return NextResponse.json({ ok: false }, { status: 401 });
  await writeSession({ ver: s.ver, adminUntil: Date.now() + ADMIN_IDLE_MS });
  return NextResponse.json({ ok: true });
}
