import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { db } from "@/lib/supabase";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const valid = (d: unknown): d is string => typeof d === "string" && DATE.test(d) && !Number.isNaN(Date.parse(d));
const NO_TABLE = "횟수 저장소가 아직 없어요. 0011_ticket_passes.sql을 실행해 주세요";

/** 센터별 크루권 횟수(구매분) 추가/수정/삭제(관리자).
 *  추가: { centerId, startDate, endDate, quantity } · 수정: { id, startDate, endDate, quantity } · 삭제: { id, delete: true } */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return bad("invalid");
  const fail = (e: { code?: string }) => bad(e.code === "42P01" || e.code === "PGRST205" ? NO_TABLE : "저장하지 못했어요", 500);

  if (b.delete === true) {
    if (typeof b.id !== "number") return bad("invalid");
    const { error } = await db().from("ticket_passes").delete().eq("id", b.id);
    if (error) return fail(error);
    await audit("ticket.pass.delete", { detail: { id: b.id } });
    return NextResponse.json({ ok: true });
  }

  if (!valid(b.startDate) || !valid(b.endDate)) return bad("날짜를 입력해 주세요");
  if (b.endDate < b.startDate) return bad("종료일은 시작일 이후여야 해요");
  const quantity = typeof b.quantity === "number" ? b.quantity : Number(b.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) return bad("수량은 1 이상의 숫자로 입력해 주세요");
  const row = { start_date: b.startDate, end_date: b.endDate, quantity };

  if (typeof b.id === "number") {
    const { data, error } = await db().from("ticket_passes").update(row).eq("id", b.id).select("id").maybeSingle();
    if (error) return fail(error);
    if (!data) return bad("not_found", 404);
    await audit("ticket.pass.update", { detail: { id: b.id, ...row } });
    return NextResponse.json({ ok: true });
  }
  if (typeof b.centerId !== "number") return bad("센터를 선택해 주세요");
  const { data, error } = await db().from("ticket_passes").insert({ center_id: b.centerId, ...row }).select("id").single();
  if (error) return fail(error);
  await audit("ticket.pass.create", { detail: { id: data.id, center_id: b.centerId, ...row } });
  return NextResponse.json({ ok: true, id: data.id });
}
