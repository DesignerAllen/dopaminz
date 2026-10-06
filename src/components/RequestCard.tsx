import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { activePeople, breakdown, canceledPeople, dotDate, paidInfo, won } from "@/lib/ticket-calc";
import type { TicketRequest } from "@/lib/tickets";

/** 납부 상태 배지: 취소됨 / 납부(전원) / 일부 납부(n/m) / 미납 */
export function StatusBadge({ r }: { r: Pick<TicketRequest, "status" | "people"> }) {
  if (r.status === "canceled") return <Badge variant="outline" className="h-6 bg-muted px-2.5 text-[12px] text-muted-foreground">취소됨</Badge>;
  const i = paidInfo(r);
  if (i.all) return <Badge className="h-6 border-transparent bg-[#ddf0e6] px-2.5 text-[12px] font-semibold text-[#0b5a44]">납부</Badge>;
  if (i.partial) return <Badge className="h-6 border-transparent bg-[#fff1b8] px-2.5 text-[12px] font-semibold text-[#5e4100]">일부 납부 {i.paidCount}/{i.total}</Badge>;
  return <Badge className="h-6 border-transparent bg-[#fce3d6] px-2.5 text-[12px] font-semibold text-[#8a2f0b]">미납</Badge>;
}

/** 크루권 신청 한 건. 크루원 목록과 관리자 목록이 함께 쓴다. actions: 카드 아래에 놓을 버튼 영역 */
export default function RequestCard({ r, actions, admin = false }: { r: TicketRequest; actions?: React.ReactNode; admin?: boolean }) {
  const canceled = r.status === "canceled";
  const info = paidInfo(r);
  const people = activePeople(r);
  const paid = people.filter((p) => p.paid);
  const unpaid = people.filter((p) => !p.paid);
  const canceledList = canceledPeople(r);
  const rows = canceled
    ? [["신청 인원", r.people]] as const
    : canceledList.length > 0
      ? [["납부 인원", paid], ["미납 인원", unpaid], ["취소 인원", canceledList]] as const
      : [["납부 인원", paid], ["미납 인원", unpaid]] as const;
  return (
    <li className="rounded-[10px] border bg-card p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{dotDate(r.used_on)}</span>
        {admin || canceled ? <StatusBadge r={r} /> : <Badge variant="outline" className="h-6 bg-muted px-2.5 text-[12px] font-semibold">{r.item_name}</Badge>}
      </div>
      <div className={cn("mt-1.5", canceled && "opacity-60")}>
        <div className="flex flex-wrap items-baseline gap-x-2 text-[15px] font-semibold">
          <span>{r.center_name}{r.branch_name ? ` · ${r.branch_name}` : ""}</span>
          {admin && <span className="text-[13px] font-normal text-muted-foreground">{r.item_name}</span>}
        </div>
        <dl className="mt-2 grid gap-1.5 text-[13px] leading-snug">
          {rows.map(([label, list]) => (
            <div key={label} className="flex gap-3">
              <dt className="w-[52px] flex-none text-muted-foreground">{label}</dt>
              <dd className={cn("min-w-0 flex-1 break-keep text-foreground/80", label === "취소 인원" && "text-muted-foreground line-through")}>{list.length > 0 ? list.map((p) => p.name).join(", ") : "-"}</dd>
            </div>
          ))}
        </dl>
        {admin && (
          <>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted-foreground">{breakdown(r)}</span>
              <span className="flex items-baseline gap-1.5">
                {!canceled && canceledList.length > 0 && <span className="text-xs text-muted-foreground line-through">{won(r.total_price)}</span>}
                <span className={cn("text-base font-semibold", canceled && "line-through")}>{won(canceled ? r.total_price : info.totalAmount)}</span>
              </span>
            </div>
            {!canceled && info.partial && (
              <p className="mt-1 text-right text-xs text-muted-foreground">납부 {won(info.paidAmount)} · 남은 금액 {won(info.unpaidAmount)}</p>
            )}
          </>
        )}
      </div>
      {actions && <div className="mt-3 flex justify-end gap-2">{actions}</div>}
    </li>
  );
}
