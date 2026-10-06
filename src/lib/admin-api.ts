import "server-only";
import { NextResponse } from "next/server";
import { currentVersion } from "./guard";
import { db } from "./supabase";
import { isAdmin, readSession, type Session } from "./session";

/** 관리자 API 공통 검문: 관리자 세션이 아니면 401. (세션 7일 연장은 화면 접속 시 proxy 가 한다) */
export async function requireAdminApi(): Promise<{ session: Session } | { error: NextResponse }> {
  const s = await readSession();
  if (!s || !isAdmin(s) || (await currentVersion()) !== s.ver) {
    return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) };
  }
  return { session: s };
}

export async function audit(action: string, fields: { member_id?: number; year_month?: string; detail?: unknown } = {}) {
  await db().from("audit_log").insert({ action, member_id: fields.member_id ?? null, year_month: fields.year_month ?? null, detail: fields.detail ?? null });
}

export const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });
