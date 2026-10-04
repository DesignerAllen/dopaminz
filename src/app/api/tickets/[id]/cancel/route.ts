import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { db } from "@/lib/supabase";

/** 신청 취소(관리자만). 납부 처리된 이용자가 있으면 먼저 납부를 해제해야 한다. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return bad("invalid");

  const { data: r } = await db().from("ticket_requests").select("id, status").eq("id", id).maybeSingle();
  if (!r) return bad("신청 내역을 찾을 수 없어요", 404);
  if (r.status === "canceled") return NextResponse.json({ ok: true });

  const { count } = await db().from("ticket_request_people").select("id", { count: "exact", head: true }).eq("request_id", id).eq("paid", true);
  if ((count ?? 0) > 0) return bad("납부 처리된 이용자가 있어요. 납부를 먼저 해제한 뒤 취소해 주세요", 409);

  const { error } = await db().from("ticket_requests").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("id", id);
  if (error) return bad("취소하지 못했어요", 500);
  await audit("ticket.cancel", { detail: { id } });
  return NextResponse.json({ ok: true });
}
