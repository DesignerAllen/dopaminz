import "server-only";
import { redirect } from "next/navigation";
import { db } from "./supabase";
import { readSession, isAdmin, type Session } from "./session";

export async function currentVersion(): Promise<number | null> {
  const { data } = await db().from("settings").select("session_version").eq("id", 1).maybeSingle();
  return (data as { session_version: number } | null)?.session_version ?? null;
}

/** 서버 컴포넌트/핸들러용: 유효한 뷰어 세션이 없으면 /login 으로 보낸다. */
/** next: 로그인 뒤 돌아올 주소. adminTo: 관리자 모드일 때 크루원 화면 대신 보낼 관리자 화면(관리자 모드에서는 일반 화면을 보지 않는다) */
export async function requireViewer(next?: string, opts?: { adminTo?: string }): Promise<Session> {
  const s = await readSession();
  if (!s || (await currentVersion()) !== s.ver) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  if (opts?.adminTo && isAdmin(s)) redirect(opts.adminTo);
  return s;
}

/** 유효한 관리자 세션이 없으면 /admin/login 으로 보낸다. */
export async function requireAdmin(): Promise<Session> {
  const s = await requireViewer();
  if (!isAdmin(s)) redirect("/admin/login");
  return s;
}
