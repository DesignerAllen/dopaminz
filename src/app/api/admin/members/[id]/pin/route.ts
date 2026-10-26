import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { loadSecrets } from "@/lib/auth";
import { db } from "@/lib/supabase";

/** 개인 비밀번호 초기화(분실 대응): 통합 로그인 비밀번호와 같은 값으로 되돌린다. 저장한 성향 테스트 결과는 그대로 둔다. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return bad("invalid");

  const { data } = await db().from("members").select("id").eq("id", id).maybeSingle();
  if (!data) return bad("member_not_found", 404);
  const { error } = await db().from("members").update({ pin_hash: (await loadSecrets()).viewer_pin_hash, pin_set_at: new Date().toISOString() }).eq("id", id);
  if (error) return bad("db", 500);

  await audit("member.pin_reset", { member_id: id });
  return NextResponse.json({ ok: true });
}
