import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { validateMemberInput } from "@/lib/member-input";
import { db } from "@/lib/supabase";

/** 신청서 → 회원 등록. 회원 등록 모달과 같은 입력 검증을 쓰고, 성공하면 신청서를 '가입완료'로 바꾼다. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const id = Number((await ctx.params).id);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!Number.isInteger(id) || !b) return bad("invalid");

  const { data: app } = await db().from("crew_applications").select("status").eq("id", id).maybeSingle();
  if (!app) return bad("신청서를 찾을 수 없어요", 404);
  if (app.status !== "신규") return bad(app.status === "가입완료" ? "이미 가입 완료된 신청서예요" : "반려된 신청서예요. 반려취소 후 등록해 주세요", 409);

  const v = await validateMemberInput(b);
  if ("error" in v) return bad(v.error);
  if (v.warnings.length && b.force !== true) return bad("confirm", 409, { warnings: v.warnings });

  const { data: m, error } = await db().from("members").insert({ ...v.value, status: "회원" }).select("id").single();
  if (error || !m) return bad("db", 500);
  await db().from("crew_applications").update({ status: "가입완료", member_id: m.id }).eq("id", id);
  await audit("member.create", { member_id: m.id, detail: { ...v.value, from_application: id } });
  return NextResponse.json({ ok: true, id: m.id });
}
