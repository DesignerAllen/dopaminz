import type { TicketRequest } from "./tickets";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export const dotDate = (d: string) => d.slice(0, 10).replaceAll("-", ".");

/** 취소되지 않은 이용자 */
export const activePeople = (r: Pick<TicketRequest, "people">) => r.people.filter((p) => !p.canceled_at);
/** 취소된 이용자 */
export const canceledPeople = (r: Pick<TicketRequest, "people">) => r.people.filter((p) => p.canceled_at);

/** 이용자별 납부 현황 요약(취소된 이용자는 빼고 계산) */
export function paidInfo(r: Pick<TicketRequest, "people" | "status">) {
  const people = activePeople(r);
  const total = people.length;
  const paidCount = people.filter((p) => p.paid).length;
  const paidAmount = people.filter((p) => p.paid).reduce((a, p) => a + p.unit_price, 0);
  const totalAmount = people.reduce((a, p) => a + p.unit_price, 0);
  return {
    total, paidCount, paidAmount, totalAmount, unpaidAmount: totalAmount - paidAmount,
    all: total > 0 && paidCount === total,
    none: paidCount === 0,
    partial: paidCount > 0 && paidCount < total,
  };
}

/** "크루원 2 × 16,000원 + 게스트 1 × 17,000원". 취소된 신청은 원래 인원, 아니면 취소되지 않은 인원 기준 */
export function breakdown(r: Pick<TicketRequest, "unit_price" | "guest_unit_price" | "member_count" | "guest_count" | "people" | "status">) {
  const people = r.status === "canceled" ? null : activePeople(r);
  const members = people ? people.filter((p) => !p.is_guest).length : r.member_count;
  const guests = people ? people.filter((p) => p.is_guest).length : r.guest_count;
  const parts: string[] = [];
  if (members > 0) parts.push(`크루원 ${members} × ${won(r.unit_price)}`);
  if (guests > 0) parts.push(`게스트 ${guests} × ${won(r.guest_unit_price)}`);
  return parts.join(" + ");
}
