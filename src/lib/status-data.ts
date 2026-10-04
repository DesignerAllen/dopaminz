import "server-only";
import { db } from "./supabase";
import { SERVICE_START, quarterOf } from "./payment-rules";

export type MemberRow = { id: number; name: string; joined_at: string; instagram_id: string | null };
export type PaymentRow = { member_id: number; year_month: string; is_exception: boolean };

export type Notice = { notice_fee: string; notice_account: string; notice_due: string; hasDueColumn: boolean };

export async function loadNotice(): Promise<Notice> {
  const { data } = await db().from("settings").select("*").eq("id", 1).maybeSingle();
  const row = (data ?? {}) as Record<string, string | undefined>;
  return {
    notice_fee: row.notice_fee ?? "",
    notice_account: row.notice_account ?? "",
    notice_due: row.notice_due ?? "매월 1일", // 0002 마이그레이션 전에는 기본값
    hasDueColumn: "notice_due" in row,
  };
}

/** 선납 기록 중 가장 늦은 달 (회원 상태만). 없으면 null */
export async function loadLatestPaidMonth(): Promise<string | null> {
  const { data, error } = await db()
    .from("payments")
    .select("year_month, members!inner(status)")
    .eq("members.status", "회원")
    .order("year_month", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data as unknown as { year_month: string }[] | null)?.[0]?.year_month ?? null;
}

/** 상태가 '회원'인 사람만 (미노출은 뷰어에 보이지 않는다) */
export async function loadActiveMembers(): Promise<MemberRow[]> {
  const { data, error } = await db()
    .from("members")
    .select("id, name, joined_at, instagram_id")
    .eq("status", "회원")
    .order("joined_at", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MemberRow[];
}

/** 해당 월들의 납부 기록 (미노출 회원 제외) */
export async function loadPayments(months: string[]): Promise<PaymentRow[]> {
  const { data, error } = await db()
    .from("payments")
    .select("member_id, year_month, is_exception, members!inner(status)")
    .eq("members.status", "회원")
    .in("year_month", months);
  if (error) throw error;
  return (data ?? []) as unknown as PaymentRow[];
}

/** 이동 가능한 마지막 분기: 현재 분기, 또는 선납 기록이 있는 가장 늦은 분기 */
export async function loadMaxQuarter(currentQuarter: number): Promise<number> {
  const { data, error } = await db()
    .from("payments")
    .select("year_month, members!inner(status)")
    .eq("members.status", "회원")
    .gte("year_month", SERVICE_START)
    .order("year_month", { ascending: false })
    .limit(1);
  if (error) throw error;
  const last = (data as unknown as { year_month: string }[] | null)?.[0]?.year_month;
  return last ? Math.max(currentQuarter, quarterOf(last)) : currentQuarter;
}

export type FullMember = MemberRow & { status: "회원" | "미노출"; hidden_reason: string | null; hidden_at: string | null };

export async function loadAllMembers(): Promise<FullMember[]> {
  // select("*"): 0003 마이그레이션(hidden_at) 적용 전에도 동작하도록 컬럼을 이름으로 고르지 않는다
  const { data, error } = await db().from("members").select("*").order("joined_at", { ascending: true }).order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as (FullMember & { hidden_at?: string | null })[]).map((m) => ({
    id: m.id, name: m.name, joined_at: m.joined_at, instagram_id: m.instagram_id, status: m.status, hidden_reason: m.hidden_reason,
    hidden_at: m.hidden_at ?? null,
  }));
}

export async function loadMemberPayments(memberId: number): Promise<PaymentRow[]> {
  const { data, error } = await db().from("payments").select("member_id, year_month, is_exception").eq("member_id", memberId);
  if (error) throw error;
  return (data ?? []) as PaymentRow[];
}

/** 회원 상태 전체의 납부 기록을 1000건 단위로 모두 읽는다(경고 점검용). */
export async function loadActivePaymentsAll(): Promise<PaymentRow[]> {
  const out: PaymentRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db()
      .from("payments")
      .select("member_id, year_month, is_exception, members!inner(status)")
      .eq("members.status", "회원")
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    const rows = (data ?? []) as unknown as PaymentRow[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

/** 관리자 설정 화면에 보여줄 현재 뷰어 비밀번호. 저장된 값이 없으면(0007 적용 전 등) null */
export async function loadViewerPinDisplay(): Promise<string | null> {
  const { data } = await db().from("settings").select("*").eq("id", 1).maybeSingle();
  const v = (data as Record<string, unknown> | null)?.viewer_pin_display;
  return typeof v === "string" && /^\d{4}$/.test(v) ? v : null;
}
