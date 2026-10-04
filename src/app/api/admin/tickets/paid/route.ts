import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { db } from "@/lib/supabase";

/** 이용자별 납부 처리(관리자).
 *  body: { id: 신청 id, paid: boolean, personIds?: number[] }  — personIds 를 빼면 해당 신청의 전체 이용자.
 *  신청 전체의 paid 는 모든 이용자가 납부했을 때만 true 로 맞춘다. 취소된 신청은 바꿀 수 없다. */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const b = (await req.json().catch(() => null)) as { id?: unknown; paid?: unknown; personIds?: unknown } | null;
  const id = typeof b?.id === "number" ? b.id : NaN;
  if (!Number.isInteger(id) || typeof b?.paid !== "boolean") return bad("invalid");
  const personIds = Array.isArray(b.personIds) ? (b.personIds as unknown[]).filter((x): x is number => Number.isInteger(x)) : null;

  const { data: r } = await db().from("ticket_requests").select("id, status").eq("id", id).maybeSingle();
  if (!r || r.status !== "active") return bad("처리할 수 없는 신청이에요", 404);

  const now = b.paid ? new Date().toISOString() : null;
  let q = db().from("ticket_request_people").update({ paid: b.paid, paid_at: now }).eq("request_id", id);
  if (personIds) q = q.in("id", personIds);
  const { error } = await q;
  if (error) return bad("처리하지 못했어요", 500);

  // 신청 전체의 납부 여부를 이용자별 상태에서 다시 계산
  const { count: unpaid } = await db().from("ticket_request_people").select("id", { count: "exact", head: true }).eq("request_id", id).eq("paid", false);
  const all = (unpaid ?? 0) === 0;
  await db().from("ticket_requests").update({ paid: all, paid_at: all ? new Date().toISOString() : null }).eq("id", id);

  await audit(b.paid ? "ticket.paid" : "ticket.unpaid", { detail: { id, personIds: personIds ?? "all" } });
  return NextResponse.json({ ok: true, allPaid: all });
}
