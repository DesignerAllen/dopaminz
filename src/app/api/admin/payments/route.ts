import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { SERVICE_START } from "@/lib/payment-rules";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const b = (await req.json().catch(() => null)) as { memberId?: unknown; ym?: unknown; action?: unknown; exception?: unknown } | null;
  const memberId = typeof b?.memberId === "number" ? b.memberId : NaN;
  const ym = typeof b?.ym === "string" ? b.ym : "";
  if (!Number.isInteger(memberId) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(ym) || ym < SERVICE_START) return bad("invalid");

  if (b?.action === "uncheck") {
    const { error } = await db().from("payments").delete().eq("member_id", memberId).eq("year_month", ym);
    if (error) return bad("db", 500);
    await audit("payment.uncheck", { member_id: memberId, year_month: ym });
    return NextResponse.json({ ok: true });
  }
  if (b?.action !== "check") return bad("invalid");

  const { data: member } = await db().from("members").select("joined_at, status").eq("id", memberId).maybeSingle();
  if (!member || member.status !== "회원") return bad("member_not_found", 404);

  const joinYm = String(member.joined_at).slice(0, 7);
  if (ym < joinYm) return bad("before_join");
  // 가입달은 면제. 관리자가 '예외 납부'로만 체크할 수 있다.
  if (ym === joinYm && b.exception !== true) return bad("exception_required");
  const is_exception = ym === joinYm;

  const { error } = await db()
    .from("payments")
    .upsert({ member_id: memberId, year_month: ym, is_exception, paid_at: new Date().toISOString() }, { onConflict: "member_id,year_month" });
  if (error) return bad("db", 500);
  await audit("payment.check", { member_id: memberId, year_month: ym, detail: { is_exception } });
  return NextResponse.json({ ok: true, is_exception });
}
