import { NextResponse } from "next/server";
import { audit, bad } from "@/lib/admin-api";
import { missingTable } from "@/lib/tickets";
import { db } from "@/lib/supabase";
import { requireViewerApi } from "@/lib/viewer-api";

const MAX_PEOPLE = 30;

/** 크루권 신청(크루원). 금액은 항상 서버가 센터 항목의 단가로 계산한다. */
export async function POST(req: Request) {
  const auth = await requireViewerApi();
  if ("error" in auth) return auth.error;

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return bad("invalid");

  const usedOn = typeof b.usedOn === "string" ? b.usedOn : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(usedOn) || Number.isNaN(Date.parse(usedOn)) || usedOn < "2025-01-01" || usedOn > "2100-12-31") return bad("사용일을 확인해 주세요");

  const centerId = typeof b.centerId === "number" ? b.centerId : NaN;
  const itemId = typeof b.itemId === "number" ? b.itemId : NaN;
  const branchId = typeof b.branchId === "number" ? b.branchId : null;
  if (!Number.isInteger(centerId) || !Number.isInteger(itemId)) return bad("센터와 사용 구분을 선택해 주세요");

  const memberIds = Array.isArray(b.memberIds) ? [...new Set((b.memberIds as unknown[]).filter((x): x is number => Number.isInteger(x)))] : [];
  const guests = Array.isArray(b.guests)
    ? (b.guests as unknown[]).map((g) => (typeof g === "string" ? g.trim() : "")).filter(Boolean)
    : [];
  if (guests.some((g) => g.length > 20)) return bad("게스트 이름은 20자 이내로 입력해 주세요");
  const uniqueGuests = [...new Set(guests)];
  const total = memberIds.length + uniqueGuests.length;
  if (total < 1) return bad("이용자를 한 명 이상 입력해 주세요");
  if (total > MAX_PEOPLE) return bad(`한 번에 ${MAX_PEOPLE}명까지 신청할 수 있어요`);

  // 센터 · 지점 · 항목 검증
  const { data: center, error: cErr } = await db().from("ticket_centers").select("id, name, is_active").eq("id", centerId).maybeSingle();
  if (cErr) return bad(missingTable(cErr) ? "크루권 기능을 준비하고 있어요" : "db", 500);
  if (!center || !center.is_active) return bad("선택한 센터를 사용할 수 없어요");

  const [{ data: branches }, { data: item }] = await Promise.all([
    db().from("ticket_branches").select("id, name").eq("center_id", centerId).eq("is_active", true),
    db().from("ticket_items").select("id, name, price, guest_price, is_active").eq("id", itemId).eq("center_id", centerId).maybeSingle(),
  ]);
  if (!item || !item.is_active) return bad("선택한 사용 구분을 사용할 수 없어요");
  let branch: { id: number; name: string } | null = null;
  if (branches && branches.length > 0) {
    branch = branches.find((x: { id: number }) => x.id === branchId) ?? null;
    if (!branch) return bad("지점을 선택해 주세요");
  }

  // 크루원 검증: 현재 '회원' 상태인 사람만
  let members: { id: number; name: string }[] = [];
  if (memberIds.length) {
    const { data, error } = await db().from("members").select("id, name").in("id", memberIds).eq("status", "회원");
    if (error) return bad("db", 500);
    members = (data ?? []) as { id: number; name: string }[];
    if (members.length !== memberIds.length) return bad("크루원 정보를 확인해 주세요");
  }
  const byId = new Map(members.map((m) => [m.id, m]));

  // 단가: 크루원은 항목 단가, 게스트는 항목의 게스트 단가(없으면 크루원 단가와 같음). 이용자마다 그 시점 단가를 저장한다.
  const unit = item.price as number;
  const guestUnit = (item.guest_price as number | null) ?? unit;
  const totalPrice = unit * memberIds.length + guestUnit * uniqueGuests.length;
  const { data: row, error } = await db()
    .from("ticket_requests")
    .insert({
      used_on: usedOn, center_id: centerId, branch_id: branch?.id ?? null, item_id: itemId,
      center_name: center.name, branch_name: branch?.name ?? null, item_name: item.name,
      unit_price: unit, guest_unit_price: guestUnit, member_count: memberIds.length, guest_count: uniqueGuests.length,
      people_count: total, total_price: totalPrice,
    })
    .select("id")
    .single();
  if (error || !row) return bad("신청하지 못했어요. 다시 시도해 주세요", 500);

  const people = [
    ...memberIds.map((id, i) => ({ request_id: row.id, position: i, member_id: id, name: byId.get(id)!.name, is_guest: false, unit_price: unit })),
    ...uniqueGuests.map((name, i) => ({ request_id: row.id, position: memberIds.length + i, member_id: null, name, is_guest: true, unit_price: guestUnit })),
  ];
  const { error: pErr } = await db().from("ticket_request_people").insert(people);
  if (pErr) {
    await db().from("ticket_requests").delete().eq("id", row.id); // 이용자 저장에 실패하면 신청도 되돌린다
    return bad("신청하지 못했어요. 다시 시도해 주세요", 500);
  }
  await audit("ticket.request", { detail: { id: row.id, center: center.name, item: item.name, people: total, total: totalPrice } });
  return NextResponse.json({ ok: true, id: row.id });
}
