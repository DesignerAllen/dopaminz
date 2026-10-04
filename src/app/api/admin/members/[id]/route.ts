import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { validateMemberInput } from "@/lib/member-input";
import { db } from "@/lib/supabase";

const REASONS = ["자진 탈퇴", "경고 탈퇴", "기타"];

/** 회원 수정 한 번에: 정보(이름·가입일·인스타그램) + 상태(회원/미노출·사유·미노출일).
 *  가입일을 바꿔도 기존 납부 기록은 유지하고, 미노출이어도 납부 기록은 보존한다. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const id = Number((await ctx.params).id);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!Number.isInteger(id) || !b) return bad("invalid");

  const { data: current } = await db().from("members").select("id").eq("id", id).maybeSingle();
  if (!current) return bad("member_not_found", 404);

  const v = await validateMemberInput(b, id);
  if ("error" in v) return bad(v.error);

  // 상태
  const patch: Record<string, unknown> = { ...v.value, updated_at: new Date().toISOString() };
  let hiddenAt: string | null = null;
  if (b.status === "미노출") {
    if (typeof b.reason !== "string" || !REASONS.includes(b.reason)) return bad("미노출 사유를 선택해 주세요");
    // 미노출일은 비워 둘 수 있다(이관된 기존 미노출 회원). 입력했다면 가입일보다 이전일 수 없다.
    hiddenAt = typeof b.hidden_at === "string" && b.hidden_at ? b.hidden_at : null;
    if (hiddenAt && (!/^\d{4}-\d{2}-\d{2}$/.test(hiddenAt) || Number.isNaN(Date.parse(hiddenAt)))) return bad("미노출 날짜를 확인해 주세요");
    if (hiddenAt && hiddenAt < v.value.joined_at) return bad("미노출일은 가입일보다 이전일 수 없어요");
    patch.status = "미노출";
    patch.hidden_reason = b.reason;
  } else if (b.status === "회원") {
    patch.status = "회원";
    patch.hidden_reason = null;
  } else if (b.status !== undefined) {
    return bad("invalid");
  }

  if (v.warnings.length && b.force !== true) return bad("confirm", 409, { warnings: v.warnings });

  const withDate = b.status === undefined ? patch : { ...patch, hidden_at: b.status === "미노출" ? hiddenAt : null };
  let { error } = await db().from("members").update(withDate).eq("id", id);
  if (error?.code === "42703" || error?.code === "PGRST204") ({ error } = await db().from("members").update(patch).eq("id", id)); // hidden_at 컬럼 없음(0003 미적용)
  if (error) return bad("db", 500);

  await audit("member.update", { member_id: id, detail: { ...v.value, status: b.status, reason: b.reason, hidden_at: hiddenAt } });
  return NextResponse.json({ ok: true });
}
