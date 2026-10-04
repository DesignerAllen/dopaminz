import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { db } from "@/lib/supabase";

type Entity = "center" | "branch" | "item";
const TABLE: Record<Entity, string> = { center: "ticket_centers", branch: "ticket_branches", item: "ticket_items" };

/** 센터 · 지점 · 항목 추가/수정(관리자). id 가 있으면 수정, 없으면 추가. 삭제 대신 isActive=false 로 숨긴다. */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const entity = b?.entity as Entity;
  if (!b || !(entity in TABLE)) return bad("invalid");

  const name = typeof b.name === "string" ? b.name.trim() : undefined;
  if (name !== undefined && (name.length < 1 || name.length > 30)) return bad("이름은 1~30자로 입력해 주세요");
  let price: number | undefined;
  if (entity === "item" && b.price !== undefined) {
    price = typeof b.price === "number" ? b.price : Number(b.price);
    if (!Number.isInteger(price) || price < 0 || price > 1_000_000) return bad("금액은 0원 이상 1,000,000원 이하의 숫자로 입력해 주세요");
  }
  // 게스트 단가: 숫자면 그 값, 빈 값/null 이면 크루원 단가와 같게(null 저장)
  let guestPrice: number | null | undefined;
  if (entity === "item" && "guestPrice" in b) {
    if (b.guestPrice === null || b.guestPrice === "" || b.guestPrice === undefined) guestPrice = null;
    else {
      guestPrice = typeof b.guestPrice === "number" ? b.guestPrice : Number(b.guestPrice);
      if (!Number.isInteger(guestPrice) || guestPrice < 0 || guestPrice > 1_000_000) return bad("게스트 금액은 0원 이상 1,000,000원 이하의 숫자로 입력해 주세요");
    }
  }
  // 입장코드(센터만): 비우면 null
  let entryCode: string | null | undefined;
  if (entity === "center" && "entryCode" in b) {
    entryCode = typeof b.entryCode === "string" ? b.entryCode.trim() : "";
    if (entryCode.length > 100) return bad("입장코드는 100자 이내로 입력해 주세요");
    if (entryCode === "") entryCode = null;
  }
  const isActive = typeof b.isActive === "boolean" ? b.isActive : undefined;
  const table = TABLE[entity];

  if (typeof b.id === "number") {
    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (price !== undefined) patch.price = price;
    if (guestPrice !== undefined) patch.guest_price = guestPrice;
    if (entryCode !== undefined) patch.entry_code = entryCode;
    if (isActive !== undefined) patch.is_active = isActive;
    if (Object.keys(patch).length === 0) return bad("invalid");
    const { data, error } = await db().from(table).update(patch).eq("id", b.id).select("id").maybeSingle();
    if (error) return bad(error.code === "23505" ? "이미 있는 이름이에요" : error.code === "42703" || error.code === "PGRST204" ? "새 칸이 아직 없어요. 마이그레이션을 실행해 주세요" : "저장하지 못했어요", error.code === "23505" ? 409 : 500);
    if (!data) return bad("not_found", 404);
    await audit(`ticket.${entity}.update`, { detail: { id: b.id, ...patch } });
    return NextResponse.json({ ok: true });
  }

  // 추가
  if (name === undefined) return bad("이름을 입력해 주세요");
  const row: Record<string, unknown> = { name };
  if (entity !== "center") {
    const centerId = typeof b.centerId === "number" ? b.centerId : NaN;
    if (!Number.isInteger(centerId)) return bad("센터를 선택해 주세요");
    row.center_id = centerId;
  }
  if (entity === "center" && entryCode !== undefined) row.entry_code = entryCode;
  if (entity === "item") {
    if (price === undefined) return bad("금액을 입력해 주세요");
    row.price = price;
    row.guest_price = guestPrice ?? null;
  }
  // 정렬 순서: 같은 묶음의 맨 뒤
  let q = db().from(table).select("id", { count: "exact", head: true });
  if (entity !== "center") q = q.eq("center_id", row.center_id as number);
  const { count } = await q;
  row.sort_order = (count ?? 0) + 1;

  const { data, error } = await db().from(table).insert(row).select("id").single();
  if (error) return bad(error.code === "23505" ? "이미 있는 이름이에요" : error.code === "42703" || error.code === "PGRST204" ? "새 칸이 아직 없어요. 마이그레이션을 실행해 주세요" : "추가하지 못했어요", error.code === "23505" ? 409 : 500);
  await audit(`ticket.${entity}.create`, { detail: { id: data.id, ...row } });
  return NextResponse.json({ ok: true, id: data.id });
}
