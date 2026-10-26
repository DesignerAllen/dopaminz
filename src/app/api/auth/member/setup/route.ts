import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireViewerApi } from "@/lib/viewer-api";
import { writeSession } from "@/lib/session";
import { db } from "@/lib/supabase";

/** 개인 비밀번호 최초 등록: 공용 로그인을 마친 상태에서 크루원을 고르고 PIN 을 등록한다(확인 입력은 화면에서 맞춰 본다).
 *  이미 등록된 크루원은 덮어쓸 수 없다(분실 시 운영진이 초기화). 등록하면 바로 그 크루원으로 로그인된다. */
export async function POST(req: Request) {
  const auth = await requireViewerApi();
  if ("error" in auth) return auth.error;

  const body = (await req.json().catch(() => null)) as { memberId?: unknown; pin?: unknown } | null;
  const memberId = typeof body?.memberId === "number" ? body.memberId : NaN;
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!Number.isInteger(memberId) || !/^\d{4}$/.test(pin)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const { data } = await db().from("members").select("id, pin_hash").eq("id", memberId).eq("status", "회원").maybeSingle();
  if (!data) return NextResponse.json({ ok: false, error: "member_not_found" }, { status: 404 });
  if ((data as { pin_hash: string | null }).pin_hash) return NextResponse.json({ ok: false, error: "already_set" }, { status: 409 });

  const { error } = await db()
    .from("members")
    .update({ pin_hash: await bcrypt.hash(pin, 10), pin_set_at: new Date().toISOString() })
    .eq("id", memberId)
    .is("pin_hash", null); // 동시에 두 명이 등록해도 먼저 된 쪽만 반영
  if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 500 });

  await writeSession({ ...auth.session, mid: memberId });
  return NextResponse.json({ ok: true });
}
