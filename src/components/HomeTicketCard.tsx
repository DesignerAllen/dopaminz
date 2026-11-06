"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge, tdsButton } from "./tds";

const WARNING = "입장코드는 외부인에게 노출되지 않도록 주의해주세요";

export type HomeTicket = { id: number; usedOn: string; center: string; branch: string | null; code: string | null; dday: number };

const label = (d: number) => (d === 0 ? "D-Day" : `D-${d}`);

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
/** 2026-11-06 → 11월 6일 금요일 */
const korDate = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return `${m}월 ${day}일 ${DAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()]}요일`;
};

/** 홈(TDS): 신청한 크루권(사용일 당일까지). 날짜·센터/지점·D-day 와 [입장코드 보기] */
export default function HomeTicketCard({ tickets }: { tickets: HomeTicket[] }) {
  const [open, setOpen] = useState<HomeTicket | null>(null);
  return (
    <>
      {tickets.map((t) => (
        <section key={t.id} className="flex items-center gap-3 rounded-2xl bg-[#f2f4f6] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[15px] leading-[22.5px] font-semibold text-[#191f28]">
              <span className="truncate">{korDate(t.usedOn)}</span>
              <Badge size="small" color="elephant" variant="fill">{label(t.dday)}</Badge>
            </p>
            <p className="mt-0.5 text-[13px] leading-[19.5px] text-[#6b7684]">{t.center}{t.branch ? ` ${t.branch}` : ""} 방문 예정</p>
          </div>
          {t.code && (
            <button type="button" onClick={() => setOpen(t)} className={`${tdsButton("fill")} h-8 flex-none px-3 text-[13px]`}>
              <KeyRound className="size-3.5" /> 입장코드
            </button>
          )}
        </section>
      ))}
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>입장코드</DialogTitle>
            <DialogDescription>{WARNING}</DialogDescription>
          </DialogHeader>
          {open && (
            <div className="rounded-xl border px-3.5 py-3">
              <div className="text-xs text-muted-foreground">{open.center}</div>
              <div className="mt-0.5 text-lg font-semibold break-all tabular-nums">{open.code}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
