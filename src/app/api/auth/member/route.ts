import { NextResponse } from "next/server";
import { clientIp, compare, loadSecrets, lockState, recordAttempt } from "@/lib/auth";
import { writeSession } from "@/lib/session";
import { db } from "@/lib/supabase";

/** 크루원 개인 로그인: 이름(memberId) + 개인 PIN 4자리. 성공하면 공용 로그인과 같은 세션에 mid 를 실어 준다. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { memberId?: unknown; pin?: unknown } | null;
  const memberId = typeof body?.memberId === "number" ? body.memberId : NaN;
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!Number.isInteger(memberId) || !/^\d{4}$/.test(pin)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const ip = await clientIp();
  const before = await lockState("member", ip);
  if (before.locked) return NextResponse.json({ ok: false, locked: true, retryAfterSec: before.retryAfterSec }, { status: 429 });

  const { data } = await db().from("members").select("id, pin_hash").eq("id", memberId).eq("status", "회원").maybeSingle();
  const hash = (data as { pin_hash: string | null } | null)?.pin_hash;
  if (!hash) return NextResponse.json({ ok: false, error: "no_pin" }, { status: 409 });

  const ok = await compare(pin, hash);
  await recordAttempt("member", ip, ok);
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

  const secrets = await loadSecrets();
  await writeSession({ ver: secrets.session_version, mid: memberId });
  return NextResponse.json({ ok: true });
}
