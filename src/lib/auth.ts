import "server-only";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "./supabase";

export type Scope = "viewer" | "admin";

const WINDOW_MS = 10 * 60 * 1000;
const IP_LIMIT = 20; // 같은 IP에서 10분 내 최대 시도 횟수(과도한 자동 대입 방지용 안전장치)

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** 실패 횟수로 잠그지는 않는다. IP 단위 과다 요청만 제한한다. */
export async function lockState(_scope: Scope, ip: string): Promise<{ locked: boolean; retryAfterSec: number }> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await db()
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("at", since);
  if ((count ?? 0) >= IP_LIMIT) return { locked: true, retryAfterSec: Math.ceil(WINDOW_MS / 1000) };
  return { locked: false, retryAfterSec: 0 };
}

export async function recordAttempt(scope: Scope, ip: string, success: boolean) {
  await db().from("login_attempts").insert({ scope, ip, success });
}

export async function loadSecrets() {
  const { data, error } = await db()
    .from("settings")
    .select("viewer_pin_hash, admin_password_hash, session_version")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) throw new Error("settings 가 준비되지 않았습니다. npm run set-passwords 를 실행하세요");
  return data as { viewer_pin_hash: string; admin_password_hash: string; session_version: number };
}

export const compare = (plain: string, hash: string) => bcrypt.compare(plain, hash);
