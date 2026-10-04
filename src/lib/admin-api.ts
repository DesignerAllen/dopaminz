import "server-only";
import { NextResponse } from "next/server";
import { currentVersion } from "./guard";
import { db } from "./supabase";
import { ADMIN_IDLE_MS, isAdmin, readSession, writeSession, type Session } from "./session";

/** 관리자 API 공통 검문: 관리자 세션이 아니면 401. 통과하면 30분 만료를 연장한다. */
export async function requireAdminApi(): Promise<{ session: Session } | { error: NextResponse }> {
  const s = await readSession();
  if (!s || !isAdmin(s) || (await currentVersion()) !== s.ver) {
    return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) };
  }
  const next = { ver: s.ver, adminUntil: Date.now() + ADMIN_IDLE_MS };
  await writeSession(next);
  return { session: next };
}

export async function audit(action: string, fields: { member_id?: number; year_month?: string; detail?: unknown } = {}) {
  await db().from("audit_log").insert({ action, member_id: fields.member_id ?? null, year_month: fields.year_month ?? null, detail: fields.detail ?? null });
}

export const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });
