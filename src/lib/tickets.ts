import "server-only";
import { db } from "./supabase";

/** price: 크루원 단가, guest_price: 게스트 단가(null 이면 크루원 단가와 같음) */
export type TicketItem = { id: number; center_id: number; name: string; price: number; guest_price: number | null; sort_order: number; is_active: boolean };
export type TicketBranch = { id: number; center_id: number; name: string; sort_order: number; is_active: boolean };
export type TicketCenter = { id: number; name: string; entry_code: string | null; sort_order: number; is_active: boolean; branches: TicketBranch[]; items: TicketItem[] };
export type TicketPerson = { id: number; position: number; member_id: number | null; name: string; is_guest: boolean; unit_price: number; paid: boolean };
export type TicketPass = { id: number; center_id: number; start_date: string; end_date: string; quantity: number };
export type TicketRequest = {
  id: number;
  center_id: number | null;
  used_on: string;
  center_name: string;
  branch_name: string | null;
  item_name: string;
  /** 크루원 1인 단가 / 게스트 1인 단가 (신청 시점 값) */
  unit_price: number;
  guest_unit_price: number;
  member_count: number;
  guest_count: number;
  people_count: number;
  total_price: number;
  status: "active" | "canceled";
  /** 모든 이용자가 납부했을 때만 true (이용자별 납부에서 파생) */
  paid: boolean;
  paid_at: string | null;
  canceled_at: string | null;
  created_at: string;
  people: TicketPerson[];
};

/** 테이블이 아직 없으면(0008 마이그레이션 전) 빈 목록 + ready=false */
export const missingTable = (e: { code?: string } | null) => e?.code === "42P01" || e?.code === "PGRST205";

/** 센터·지점·항목 목록. includeInactive=false 이면 사용 중인 것만(신청 화면용), true 이면 숨김 포함(관리자 설정용) */
export async function loadCatalog(includeInactive = false): Promise<{ centers: TicketCenter[]; ready: boolean }> {
  const [c, b, i] = await Promise.all([
    db().from("ticket_centers").select("*").order("sort_order").order("id"),
    db().from("ticket_branches").select("*").order("sort_order").order("id"),
    db().from("ticket_items").select("*").order("sort_order").order("id"),
  ]);
  for (const r of [c, b, i]) {
    if (r.error) {
      if (missingTable(r.error)) return { centers: [], ready: false };
      throw r.error;
    }
  }
  const keep = <T extends { is_active: boolean }>(x: T) => includeInactive || x.is_active;
  const branches = ((b.data ?? []) as TicketBranch[]).filter(keep);
  const items = ((i.data ?? []) as TicketItem[]).filter(keep);
  const centers = ((c.data ?? []) as Omit<TicketCenter, "branches" | "items">[])
    .filter(keep)
    .map((x) => ({ ...x, entry_code: x.entry_code ?? null, branches: branches.filter((y) => y.center_id === x.id), items: items.filter((y) => y.center_id === x.id) }));
  return { centers, ready: true };
}

type RawPerson = { id: number; position: number; member_id: number | null; name: string; is_guest: boolean; unit_price?: number | null; paid?: boolean | null };
type RawRequest = Omit<TicketRequest, "people" | "guest_unit_price" | "member_count" | "guest_count"> & {
  guest_unit_price?: number | null; member_count?: number | null; guest_count?: number | null;
  ticket_request_people: RawPerson[];
};

/** 신청 내역: 사용일 최신순(같은 날은 늦게 신청한 순). 0009 마이그레이션 전의 옛 구조도 같은 모양으로 맞춰 준다. */
export async function loadRequests(limit = 500): Promise<{ requests: TicketRequest[]; ready: boolean }> {
  const run = (cols: string) =>
    db().from("ticket_requests").select(`*, ticket_request_people(${cols})`).order("used_on", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
  let { data, error } = await run("id, position, member_id, name, is_guest, unit_price, paid");
  if (error && (error.code === "42703" || error.code === "PGRST204" || /column/.test(error.message ?? ""))) ({ data, error } = await run("id, position, member_id, name, is_guest"));
  if (error) {
    if (missingTable(error)) return { requests: [], ready: false };
    throw error;
  }
  const requests = ((data ?? []) as unknown as RawRequest[]).map(({ ticket_request_people, ...r }) => {
    const guestPrice = r.guest_unit_price ?? r.unit_price;
    const people: TicketPerson[] = [...(ticket_request_people ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((p) => ({ id: p.id, position: p.position, member_id: p.member_id, name: p.name, is_guest: p.is_guest, unit_price: p.unit_price ?? (p.is_guest ? guestPrice : r.unit_price), paid: p.paid ?? r.paid }));
    const guests = people.filter((p) => p.is_guest).length;
    return {
      ...r,
      guest_unit_price: guestPrice,
      member_count: r.member_count ?? people.length - guests,
      guest_count: r.guest_count ?? guests,
      people,
    } satisfies TicketRequest;
  });
  return { requests, ready: true };
}

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export const dotDate = (d: string) => d.slice(0, 10).replaceAll("-", ".");

/** 센터별 횟수(구매분). 테이블이 아직 없으면 빈 목록 */
export async function loadPasses(): Promise<TicketPass[]> {
  const { data, error } = await db().from("ticket_passes").select("*").order("start_date").order("id");
  if (error) {
    if (missingTable(error)) return [];
    throw error;
  }
  return (data ?? []) as TicketPass[];
}
