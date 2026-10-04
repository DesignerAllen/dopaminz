"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCsv, ticketsToCsv } from "@/lib/ticket-export";
import type { TicketRequest } from "@/lib/tickets";

const kstNow = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date()); // YYYY-MM-DD
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** [엑셀로 내보내기]: 시작 년월 ~ 종료 년월(사용일 기준)을 골라 그 기간의 사용 내역 전체를 CSV 로 내려받는다.
 *  화면의 센터·이름 필터와는 무관하다. */
export default function TicketExportDialog({ requests }: { requests: TicketRequest[] }) {
  const today = kstNow();
  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7));
  const firstYear = Math.min(nowYear, ...requests.map((r) => Number(r.used_on.slice(0, 4))));
  const years = Array.from({ length: nowYear + 1 - firstYear + 1 }, (_, i) => firstYear + i);

  const [open, setOpen] = useState(false);
  const [sy, setSy] = useState(nowYear);
  const [sm, setSm] = useState(nowMonth);
  const [ey, setEy] = useState(nowYear);
  const [em, setEm] = useState(nowMonth);

  const key = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const from = key(sy, sm);
  const to = key(ey, em);
  const invalid = from > to;
  const picked = useMemo(() => requests.filter((r) => { const k = r.used_on.slice(0, 7); return k >= from && k <= to; }), [requests, from, to]);
  const people = picked.reduce((n, r) => n + r.people.length, 0);

  function run() {
    downloadCsv(ticketsToCsv(picked), `크루권_사용내역_${from.replace("-", "")}-${to.replace("-", "")}.csv`);
    toast.success(`${picked.length}건 (${people}명)을 내려받았어요`);
    setOpen(false);
  }

  const pickers = (label: string, y: number, m: number, setY: (v: number) => void, setM: (v: number) => void) => (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Select value={String(y)} onValueChange={(v) => setY(Number(v))}>
          <SelectTrigger className="w-full" aria-label={`${label} 연도`}><SelectValue>{y}년</SelectValue></SelectTrigger>
          <SelectContent>{years.map((v) => <SelectItem key={v} value={String(v)}>{v}년</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(m)} onValueChange={(v) => setM(Number(v))}>
          <SelectTrigger className="w-full" aria-label={`${label} 월`}><SelectValue>{m}월</SelectValue></SelectTrigger>
          <SelectContent>{MONTHS.map((v) => <SelectItem key={v} value={String(v)}>{v}월</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={requests.length === 0}><Download /> 엑셀로 내보내기</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[360px]">
        <DialogHeader>
          <DialogTitle>사용 내역 내보내기</DialogTitle>
          <DialogDescription>사용일 기준으로 선택한 기간의 내역을 CSV 파일로 내려받아요.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {pickers("시작 년월", sy, sm, setSy, setSm)}
          {pickers("종료 년월", ey, em, setEy, setEm)}
          <p className={`text-[13px] ${invalid ? "font-medium text-destructive" : "text-muted-foreground"}`} role="status">
            {invalid ? "종료 년월은 시작 년월 이후여야 해요" : `${sy}년 ${sm}월 ~ ${ey}년 ${em}월 · ${picked.length}건 (${people}명)`}
          </p>
        </div>
        <DialogFooter className="flex-row gap-2.5">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>취소</Button>
          <Button className="flex-1" disabled={invalid || picked.length === 0} onClick={run}>내려받기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
