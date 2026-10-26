import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { clientIp, compare, lockState, recordAttempt } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { requireViewerApi } from "@/lib/viewer-api";

/** 개인 비밀번호 변경: 현재 비밀번호를 확인한 뒤 새 4자리로 바꾼다(개인 로그인 상태에서만) */
export async function POST(req: Request) {
  const auth = await requireViewerApi();
  if ("error" in auth) return auth.error;
  const mid = auth.session.mid;
  if (!mid) return NextResponse.json({ ok: false, error: "member_required" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { current?: unknown; next?: unknown } | null;
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";
  if (!/^\d{4}$/.test(current) || !/^\d{4}$/.test(next)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const ip = await clientIp();
  const before = await lockState("member", ip);
  if (before.locked) return NextResponse.json({ ok: false, locked: true, retryAfterSec: before.retryAfterSec }, { status: 429 });

  const { data } = await db().from("members").select("pin_hash").eq("id", mid).maybeSingle();
  const hash = (data as { pin_hash: string | null } | null)?.pin_hash;
  if (!hash) return NextResponse.json({ ok: false, error: "no_pin" }, { status: 409 });

  const ok = await compare(current, hash);
  await recordAttempt("member", ip, ok);
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

  const { error } = await db().from("members").update({ pin_hash: await bcrypt.hash(next, 10), pin_set_at: new Date().toISOString() }).eq("id", mid);
  if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
