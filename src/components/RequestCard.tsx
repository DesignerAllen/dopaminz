import { Badge, ListRow } from "./tds";
import { cn } from "@/lib/utils";
import { activePeople, breakdown, canceledPeople, dotDate, paidInfo, won } from "@/lib/ticket-calc";
import type { TicketRequest } from "@/lib/tickets";

/** 사용 구분 태그 색: 크루 모임 파랑 / 개인 보라 / 그 외 회색 */
function itemColor(name: string): "blue" | "purple" | "elephant" {
  if (name.includes("크루")) return "blue";
  if (name.includes("개인")) return "purple";
  return "elephant";
}

/** 납부 상태 배지(TDS Badge weak): 취소됨 / 납부(전원) / 일부 납부(n/m) / 미납 */
export function StatusBadge({ r }: { r: Pick<TicketRequest, "status" | "people"> }) {
  if (r.status === "canceled") return <Badge size="small" color="red" variant="weak">취소됨</Badge>;
  const i = paidInfo(r);
  if (i.all) return <Badge size="small" color="green" variant="weak">납부</Badge>;
  if (i.partial) return <Badge size="small" color="yellow" variant="weak">일부 납부 {i.paidCount}/{i.total}</Badge>;
  return <Badge size="small" color="red" variant="weak">미납</Badge>;
}

/** 크루권 신청 한 건 = TDS ListRow 한 줄. 크루원 목록과 관리자 목록이 함께 쓴다.
 *  left 없음 · contents(날짜 / 센터·지점 / 인원 정보) · right(태그, 위쪽 정렬) · 행 사이는 왼쪽 24px 들여쓴 구분선(border="indented").
 *  actions: 행 아래에 놓을 버튼 영역 */
export default function RequestCard({ r, actions, admin = false }: { r: TicketRequest; actions?: React.ReactNode; admin?: boolean }) {
  const canceled = r.status === "canceled";
  const info = paidInfo(r);
  const people = activePeople(r);
  const paid = people.filter((p) => p.paid);
  const unpaid = people.filter((p) => !p.paid);
  const canceledList = canceledPeople(r);
  const rows = canceled
    ? [["신청", r.people]] as const
    : canceledList.length > 0
      ? [["납부", paid], ["미납", unpaid], ["취소", canceledList]] as const
      : [["납부", paid], ["미납", unpaid]] as const;

  const contents = (
    <>
      <span className="block text-[13px] leading-[19.5px] text-[#6b7684]">{dotDate(r.used_on)}</span>
      <span className={cn("flex flex-wrap items-baseline gap-x-2 text-[17px] leading-[25.5px] font-semibold", canceled ? "text-[#b0b8c1]" : "text-[#191f28]")}>
        <span>{r.center_name}{r.branch_name ? ` · ${r.branch_name}` : ""}</span>
        {admin && <span className="text-[13px] font-normal text-muted-foreground">{r.item_name}</span>}
      </span>
      <dl className="mt-1.5 grid gap-1 text-[13px] leading-snug">
        {rows.map(([label, list]) => (
          <div key={label} className="flex gap-3">
            <dt className={cn("w-7 flex-none", canceled ? "text-[#c5cbd2]" : "text-muted-foreground")}>{label}</dt>
            <dd className={cn("min-w-0 flex-1 break-keep text-foreground/80", canceled && "text-[#b0b8c1]", label === "취소" && "text-muted-foreground line-through", label === "미납" && list.length > 0 && "text-[#d22030]")}>{list.length > 0 ? list.map((p) => p.name).join(", ") : "-"}</dd>
          </div>
        ))}
      </dl>
      {admin && (
        <>
          <span className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xs text-muted-foreground">{breakdown(r)}</span>
            <span className="flex items-baseline gap-1.5">
              {!canceled && canceledList.length > 0 && <span className="text-xs text-muted-foreground line-through">{won(r.total_price)}</span>}
              <span className={cn("text-base font-semibold", canceled && "line-through")}>{won(canceled ? r.total_price : info.totalAmount)}</span>
            </span>
          </span>
          {!canceled && info.partial && (
            <span className="mt-1 block text-right text-xs text-muted-foreground">납부 {won(info.paidAmount)} · 남은 금액 {won(info.unpaidAmount)}</span>
          )}
        </>
      )}
    </>
  );

  const tag = admin || canceled ? <StatusBadge r={r} /> : <Badge size="small" color={itemColor(r.item_name)} variant="weak">{r.item_name}</Badge>;

  return (
    // 행 사이 구분선: 왼쪽 24px 들여쓰기(ListRow border="indented"), 마지막 행은 선 없음
    <li className="relative after:absolute after:right-0 after:bottom-0 after:left-6 after:h-px after:bg-[#f2f4f6] last:after:hidden">
      <ListRow contents={contents} right={tag} rightAlignment="top" verticalPadding="large" />
      {actions && <div className="-mt-1 flex justify-end gap-2 px-6 pb-4">{actions}</div>}
    </li>
  );
}
