import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { db } from "@/lib/supabase";

const NO_COLUMN = "이용자별 취소 저장소가 아직 없어요. 0013_ticket_person_cancel.sql을 실행해 주세요";

/** 이용자별 신청 취소(관리자만).
 *  body: { personIds?: number[] } — personIds 를 빼면 해당 신청의 취소되지 않은 이용자 전체.
 *  이용자 행은 지우지 않고 canceled_at 만 남긴다(취소 내역 보존, 잔여 횟수는 계산에서 자동 복구).
 *  납부한 이용자도 취소할 수 있다(관리자가 환불을 확인한 뒤 취소). 납부 기록은 그대로 두고 취소 시각만 남긴다.
 *  모든 이용자가 취소되면 신청도 취소 상태가 된다. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return bad("invalid");
  const b = (await req.json().catch(() => null)) as { personIds?: unknown } | null;
  const personIds = Array.isArray(b?.personIds) ? (b.personIds as unknown[]).filter((x): x is number => Number.isInteger(x)) : null;
  if (personIds && personIds.length === 0) return bad("취소할 이용자를 선택해 주세요");

  const { data: r } = await db().from("ticket_requests").select("id, status").eq("id", id).maybeSingle();
  if (!r) return bad("신청 내역을 찾을 수 없어요", 404);
  if (r.status === "canceled") return NextResponse.json({ ok: true, requestCanceled: true });

  const { data: people, error: pErr } = await db().from("ticket_request_people").select("id, name, paid, canceled_at").eq("request_id", id);
  if (pErr) return bad(pErr.code === "42703" || pErr.code === "PGRST204" ? NO_COLUMN : "취소하지 못했어요", 500);
  const active = (people ?? []).filter((p) => !p.canceled_at) as { id: number; name: string; paid: boolean }[];
  const targets = personIds ? active.filter((p) => personIds.includes(p.id)) : active;
  if (targets.length === 0) return bad("이미 취소된 이용자예요", 409);
  const refunded = targets.filter((p) => p.paid).map((p) => p.name); // 환불 확인 후 취소된 납부자(이력용)

  const now = new Date().toISOString();
  const ids = targets.map((p) => p.id);
  const { error } = await db().from("ticket_request_people").update({ canceled_at: now }).in("id", ids).is("canceled_at", null);
  if (error) return bad("취소하지 못했어요", 500);

  // 남은 이용자가 없으면 신청 자체를 취소, 있으면 신청 전체 납부 여부를 남은 이용자 기준으로 다시 계산
  const rest = active.filter((p) => !ids.includes(p.id));
  const all = rest.length === 0;
  const patch = all
    ? { status: "canceled", canceled_at: now, paid: false, paid_at: null }
    : rest.every((p) => p.paid) ? { paid: true, paid_at: now } : { paid: false, paid_at: null };
  await db().from("ticket_requests").update(patch).eq("id", id);

  await audit("ticket.cancel", { detail: { id, personIds: ids, names: targets.map((p) => p.name), refunded, requestCanceled: all } });
  return NextResponse.json({ ok: true, canceled: ids.length, requestCanceled: all });
}
