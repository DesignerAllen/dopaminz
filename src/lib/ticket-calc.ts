import type { TicketRequest } from "./tickets";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export const dotDate = (d: string) => d.slice(0, 10).replaceAll("-", ".");

/** 이용자별 납부 현황 요약 */
export function paidInfo(r: Pick<TicketRequest, "people" | "status">) {
  const total = r.people.length;
  const paidCount = r.people.filter((p) => p.paid).length;
  const paidAmount = r.people.filter((p) => p.paid).reduce((a, p) => a + p.unit_price, 0);
  const totalAmount = r.people.reduce((a, p) => a + p.unit_price, 0);
  return {
    total, paidCount, paidAmount, totalAmount, unpaidAmount: totalAmount - paidAmount,
    all: total > 0 && paidCount === total,
    none: paidCount === 0,
    partial: paidCount > 0 && paidCount < total,
  };
}

/** "크루원 2 × 16,000원 + 게스트 1 × 17,000원" */
export function breakdown(r: Pick<TicketRequest, "unit_price" | "guest_unit_price" | "member_count" | "guest_count">) {
  const parts: string[] = [];
  if (r.member_count > 0) parts.push(`크루원 ${r.member_count} × ${won(r.unit_price)}`);
  if (r.guest_count > 0) parts.push(`게스트 ${r.guest_count} × ${won(r.guest_unit_price)}`);
  return parts.join(" + ");
}
