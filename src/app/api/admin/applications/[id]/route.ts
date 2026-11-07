import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { db } from "@/lib/supabase";

/** 반려 / 반려취소. 가입완료 건은 상태를 바꿀 수 없다. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const id = Number((await ctx.params).id);
  const b = (await req.json().catch(() => null)) as { status?: unknown } | null;
  if (!Number.isInteger(id) || (b?.status !== "반려" && b?.status !== "신규")) return bad("invalid");

  const { data: cur } = await db().from("crew_applications").select("status").eq("id", id).maybeSingle();
  if (!cur) return bad("신청서를 찾을 수 없어요", 404);
  if (cur.status === "가입완료") return bad("이미 가입 완료된 신청서예요", 409);

  const { error } = await db().from("crew_applications").update({ status: b.status }).eq("id", id);
  if (error) return bad("db", 500);
  await audit(b.status === "반려" ? "application.reject" : "application.restore", { detail: { id } });
  return NextResponse.json({ ok: true });
}

/** 신청서 삭제(가입완료 건을 지워도 등록된 회원은 그대로 남는다) */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return bad("invalid");
  const { error } = await db().from("crew_applications").delete().eq("id", id);
  if (error) return bad("db", 500);
  await audit("application.delete", { detail: { id } });
  return NextResponse.json({ ok: true });
}
