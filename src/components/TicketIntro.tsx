"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CopyAccount from "./CopyAccount";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WARNING = "입장코드는 외부인에게 노출되지 않도록 주의해주세요";

type Center = { id: number; name: string; branches: string[]; code: string | null; remaining?: number | null };

/** 크루권 신청 목록 상단 안내: 사용 가능한 센터·지점과 [입장코드 보기](누르면 센터별 입장코드 표시, 복사 기능 없음) */
export default function TicketIntro({ centers, account }: { centers: Center[]; account?: string }) {
  const [open, setOpen] = useState(false);
  const withCode = centers.filter((c) => c.code);
  if (centers.length === 0) return null;
  return (
    <>
      <Alert className="mx-4 mt-4 w-auto border-0 bg-accent px-3 py-4 text-accent-foreground">
        <AlertDescription className="text-sm leading-relaxed break-keep text-accent-foreground">
          <p className="mb-3 text-foreground/80">크루권 신청하기를 통해 신청서를 작성하고 계좌로 입금해주세요. 게스트가 있다면 크루원이 대표로 작성해주세요.</p>
          <ul className="space-y-1">
            {centers.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <b className="font-semibold">{c.name}</b>
                    {c.branches.length > 0 && <span className="text-foreground/80"> {c.branches.join(" ")}</span>}
                  </span>
                  {c.remaining != null && <b className="flex-none font-semibold tabular-nums">{c.remaining.toLocaleString("ko-KR")}회 남음</b>}
                </div>
              </li>
            ))}
          </ul>
          {(withCode.length > 0 || account) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {withCode.length > 0 && (
                <Button variant="outline" size="sm" className="h-9 flex-none bg-background" onClick={() => setOpen(true)}>
                  <KeyRound /> 입장코드 보기
                </Button>
              )}
              {account && <CopyAccount account={account} light />}
            </div>
          )}
          {withCode.length > 0 && <p className="mt-2 text-xs leading-snug break-keep text-foreground/70">{WARNING}</p>}
        </AlertDescription>
      </Alert>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>입장코드</DialogTitle>
            <DialogDescription>{WARNING}</DialogDescription>
          </DialogHeader>
          <ul className="divide-y rounded-[10px] border">
            {withCode.map((c) => (
              <li key={c.id} className="px-3.5 py-3">
                <div className="text-xs text-muted-foreground">{c.name}</div>
                <div className="mt-0.5 text-lg font-semibold break-all tabular-nums">{c.code}</div>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
