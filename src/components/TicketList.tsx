"use client";

import RequestCard from "./RequestCard";
import { useTicketFilter } from "./TicketFilters";
import type { TicketRequest } from "@/lib/tickets";

/** 크루원: 신청 내역(최신순)과 구분. 센터별 보기 · 이름 검색 필터. 신청 취소는 운영진만 할 수 있어서 버튼이 없다. */
export default function TicketList({ requests, ready, centers }: { requests: TicketRequest[]; ready: boolean; centers: string[] }) {
  const { bar, filtered, active } = useTicketFilter(requests, centers);
  if (requests.length === 0) {
    return <p className="mx-4 mt-4 rounded-[10px] border bg-card p-8 text-center text-sm text-muted-foreground">{ready ? "신청 내역이 없어요" : "크루권 기능을 준비하고 있어요"}</p>;
  }
  return (
    <>
      <div className="mx-4 mt-4">{bar}</div>
      {filtered.length === 0 ? (
        <p className="mx-4 mt-3 rounded-[10px] border bg-card p-8 text-center text-sm text-muted-foreground">{active ? "조건에 맞는 신청이 없어요" : "신청 내역이 없어요"}</p>
      ) : (
        <ul className="mx-4 mt-3 flex flex-col gap-2.5">
          {filtered.map((r) => <RequestCard key={r.id} r={r} />)}
        </ul>
      )}
      <p className="mx-5 mt-4 mb-8 text-xs text-muted-foreground">잘못 신청했거나 취소가 필요하면 운영진에게 알려주세요.</p>
    </>
  );
}
