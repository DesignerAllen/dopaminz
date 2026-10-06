"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import RequestCard from "./RequestCard";
import { useTicketFilter } from "./TicketFilters";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TicketExportDialog from "./TicketExportDialog";
import { activePeople, breakdown, canceledPeople, dotDate, paidInfo, won } from "@/lib/ticket-calc";
import type { TicketRequest } from "@/lib/tickets";

const kstTime = (iso: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

/** 관리자: 신청 목록. 납부는 신청마다 [납부 관리] 모달에서 이용자별로 체크하고, 전체 납부/전체 해제도 할 수 있다.
 *  취소는 [크루권 취소] 모달에서 이용자를 골라 취소한다(전체 선택 가능, 납부자도 환불 확인 후 취소 가능, 취소 내역은 남고 횟수는 복구된다). */
export default function AdminTicketList({ requests, ready, centers }: { requests: TicketRequest[]; ready: boolean; centers: string[] }) {
  const router = useRouter();
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [manageId, setManageId] = useState<number | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  /** 확인 대기 중인 취소: personIds 가 null 이면 남은 이용자 전체 */
  const [confirm, setConfirm] = useState<{ personIds: number[] | null; names: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const active = requests.filter((r) => r.status === "active");
  const infos = active.map((r) => paidInfo(r));
  const unpaidRequests = active.filter((r) => !paidInfo(r).all);
  const unpaidSum = infos.reduce((a, i) => a + i.unpaidAmount, 0);
  const paidSum = infos.reduce((a, i) => a + i.paidAmount, 0);
  const { bar, filtered, active: filtering } = useTicketFilter(requests, centers);
  const list = onlyUnpaid ? filtered.filter((r) => r.status === "active" && !paidInfo(r).all) : filtered;
  const managed = requests.find((r) => r.id === manageId) ?? null; // 최신 데이터(새로고침 후)를 계속 반영
  const cancelReq = requests.find((r) => r.id === cancelId) ?? null;

  function openCancel(r: TicketRequest) {
    setSelected([]);
    setCancelId(r.id);
  }

  async function setPaid(r: TicketRequest, paid: boolean, personIds?: number[]) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tickets/paid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, paid, personIds }) });
      if (res.status === 401) return router.replace("/admin/login");
      if (!res.ok) return void toast.error("처리하지 못했어요. 다시 시도해 주세요");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function cancel(r: TicketRequest, personIds: number[] | null) {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${r.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personIds ? { personIds } : {}),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; canceled?: number; requestCanceled?: boolean };
      if (res.status === 401) return router.replace("/admin/login");
      if (!res.ok) return void toast.error(data.error ?? "취소하지 못했어요");
      toast.success(data.requestCanceled ? "신청을 모두 취소했어요" : `${data.canceled ?? 0}명을 취소했어요`);
      setConfirm(null);
      setSelected([]);
      if (data.requestCanceled) setCancelId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 pt-3 pb-10">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[10px] bg-[#fce3d6] p-3 text-[#8a2f0b]"><div className="text-xs font-semibold">미납 {unpaidRequests.length}건</div><b className="text-lg font-semibold">{won(unpaidSum)}</b></div>
        <div className="rounded-[10px] bg-[#ddf0e6] p-3 text-[#0b5a44]"><div className="text-xs font-semibold">납부 완료</div><b className="text-lg font-semibold">{won(paidSum)}</b></div>
      </div>

      <div className="mt-3">{bar}</div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex min-h-8 w-fit cursor-pointer items-center gap-2 text-sm">
          <Checkbox className="size-5" checked={onlyUnpaid} onCheckedChange={(v) => setOnlyUnpaid(v === true)} />
          미납만 보기
        </label>
        <TicketExportDialog requests={requests} />
      </div>

      {list.length === 0 ? (
        <p className="mt-3 rounded-[10px] border bg-card p-8 text-center text-sm text-muted-foreground">
          {!ready ? "크루권 기능을 준비하고 있어요 (0008 마이그레이션 필요)" : filtering ? "조건에 맞는 신청이 없어요" : onlyUnpaid ? "미납 신청이 없어요" : "신청 내역이 없어요"}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {list.map((r) => {
            const i = paidInfo(r);
            return (
              <RequestCard
                key={r.id}
                r={r}
                admin
                actions={
                  r.status === "active" ? (
                    <>
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => openCancel(r)}>크루권 취소</Button>
                      <Button size="sm" disabled={busy} onClick={() => setManageId(r.id)} aria-label={`납부 관리, ${i.paidCount}/${i.total}명 납부`}>
                        납부 관리 <span className="font-normal opacity-80">{i.paidCount}/{i.total}</span>
                      </Button>
                    </>
                  ) : null
                }
              />
            );
          })}
        </ul>
      )}

      {/* 이용자별 납부 체크 */}
      <Dialog open={!!managed} onOpenChange={(o) => !o && setManageId(null)}>
        <DialogContent className="max-h-[90dvh] max-w-[380px] overflow-y-auto">
          {managed && (() => {
            const i = paidInfo(managed);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>납부 관리</DialogTitle>
                  <DialogDescription>
                    {dotDate(managed.used_on)} {managed.center_name}{managed.branch_name ? ` · ${managed.branch_name}` : ""} · {managed.item_name}
                  </DialogDescription>
                </DialogHeader>

                <ul className="divide-y rounded-[10px] border">
                  {activePeople(managed).map((p) => (
                    <li key={p.id}>
                      <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2">
                        <Checkbox
                          className="size-6"
                          checked={p.paid}
                          disabled={busy}
                          aria-label={`${p.name} 납부`}
                          onCheckedChange={(v) => setPaid(managed, v === true, [p.id])}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                            {p.name}
                            {p.is_guest && <Badge variant="outline" className="h-5 px-1.5 text-[11px]">게스트</Badge>}
                          </span>
                          <span className="block text-xs text-muted-foreground">{p.paid ? "납부 완료" : "미납"}</span>
                        </span>
                        <span className="text-sm font-semibold">{won(p.unit_price)}</span>
                      </label>
                    </li>
                  ))}
                </ul>

                <div className="rounded-[10px] bg-muted px-3 py-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">합계</span><b className="font-semibold">{won(i.totalAmount)}</b></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">납부</span><span>{won(i.paidAmount)} ({i.paidCount}/{i.total}명)</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">남은 금액</span><span>{won(i.unpaidAmount)}</span></div>
                  <p className="mt-1 text-xs text-muted-foreground">{breakdown(managed)}</p>
                </div>

                <DialogFooter className="flex-row gap-2.5">
                  <Button variant="outline" className="flex-1" onClick={() => setManageId(null)}>닫기</Button>
                  {i.all ? (
                    <Button variant="outline" className="flex-1" disabled={busy} onClick={() => setPaid(managed, false)}>전체 해제</Button>
                  ) : (
                    <Button className="flex-1" disabled={busy} onClick={() => setPaid(managed, true)}>전체 납부</Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 이용자별 취소 (관리자만) */}
      <Dialog open={!!cancelReq} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent className="max-h-[90dvh] max-w-[380px] overflow-y-auto">
          {cancelReq && (() => {
            const people = activePeople(cancelReq);
            const done = canceledPeople(cancelReq);
            const picked = people.filter((p) => selected.includes(p.id));
            const allPicked = people.length > 0 && picked.length === people.length;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>크루권 취소</DialogTitle>
                  <DialogDescription>
                    {dotDate(cancelReq.used_on)} {cancelReq.center_name}{cancelReq.branch_name ? ` · ${cancelReq.branch_name}` : ""} · {cancelReq.item_name}
                  </DialogDescription>
                </DialogHeader>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  취소한 이용자는 내역에 남고, 차감된 크루권 횟수는 다시 돌아와요. 납부한 이용자는 환불한 뒤 취소해 주세요.
                </p>

                {people.length > 0 && (
                  <div>
                    <label className="flex min-h-10 w-fit cursor-pointer items-center gap-2 px-3 text-sm font-semibold">
                      <Checkbox
                        className="size-5"
                        checked={allPicked}
                        disabled={busy}
                        onCheckedChange={(v) => setSelected(v === true ? people.map((p) => p.id) : [])}
                      />
                      전체 선택 ({picked.length}/{people.length})
                    </label>
                    <ul className="divide-y rounded-[10px] border">
                      {people.map((p) => (
                        <li key={p.id}>
                          <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2">
                            <Checkbox
                              className="size-6"
                              checked={selected.includes(p.id)}
                              disabled={busy}
                              aria-label={`${p.name} 취소 선택`}
                              onCheckedChange={(v) => setSelected((cur) => (v === true ? [...cur, p.id] : cur.filter((x) => x !== p.id)))}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                                {p.name}
                                {p.is_guest && <Badge variant="outline" className="h-5 px-1.5 text-[11px]">게스트</Badge>}
                              </span>
                              <span className="block text-xs text-muted-foreground">{p.paid ? "납부 완료 · 환불 후 취소" : "미납"}</span>
                            </span>
                            <span className="text-sm font-semibold">{won(p.unit_price)}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {done.length > 0 && (
                  <div>
                    <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground">취소 내역 {done.length}명</div>
                    <ul className="divide-y rounded-[10px] border bg-muted/50">
                      {done.map((p) => (
                        <li key={p.id} className="flex min-h-11 items-center gap-3 px-3 py-1.5 text-sm text-muted-foreground">
                          <span className="min-w-0 flex-1 line-through">{p.name}{p.is_guest ? " (게스트)" : ""}</span>
                          <span className="text-xs">{p.canceled_at ? `${kstTime(p.canceled_at)} 취소` : "취소됨"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <DialogFooter className="flex-row gap-2.5">
                  <Button variant="outline" className="flex-1" onClick={() => setCancelId(null)}>닫기</Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={busy || picked.length === 0}
                    onClick={() => setConfirm({ personIds: picked.length === people.length ? null : picked.map((p) => p.id), names: picked.map((p) => p.name) })}
                  >
                    크루권 취소({picked.length}명)
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 취소 확인 */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="max-w-[340px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm && `${confirm.names.length}명의 크루권을 취소할까요?`}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="grid gap-2">
                <span>{confirm && `${confirm.names.join(", ")}${confirm.personIds ? "" : " · 모든 이용자가 취소되어 신청이 취소 상태가 돼요"}`}</span>
                <span className="font-semibold text-foreground">크루권 금액을 환불했음을 확인하고 신청을 취소합니다.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2.5">
            <AlertDialogCancel className="flex-1">닫기</AlertDialogCancel>
            <AlertDialogAction className="flex-1" disabled={busy} onClick={(e) => { e.preventDefault(); if (cancelReq && confirm) void cancel(cancelReq, confirm.personIds); }}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
