import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireViewerApi } from "@/lib/viewer-api";

/** 내 인스타그램 ID 수정(개인 로그인 상태에서만). 값이 있으면 기존 값을 덮어쓰고, 비우면 삭제한다. */
export async function PATCH(req: Request) {
  const auth = await requireViewerApi();
  if ("error" in auth) return auth.error;
  const mid = auth.session.mid;
  if (!mid) return NextResponse.json({ ok: false, error: "member_required" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { instagram_id?: unknown } | null;
  let insta = typeof body?.instagram_id === "string" ? body.instagram_id.trim().replace(/^@+/, "") : null;
  if (insta === null) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  if (insta === "") insta = null;
  if (insta && !/^[A-Za-z0-9._]{1,30}$/.test(insta)) return NextResponse.json({ ok: false, error: "영문·숫자·마침표·밑줄 30자 이내만 가능해요" }, { status: 400 });

  const { error } = await db().from("members").update({ instagram_id: insta, updated_at: new Date().toISOString() }).eq("id", mid).eq("status", "회원");
  if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true, instagram_id: insta });
}
