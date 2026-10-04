"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TicketCenter, TicketPass } from "@/lib/tickets";
import { addYear } from "@/lib/ticket-passes";

export type PassView = TicketPass & { used: number };
type PassDraft = { id: number | null; centerId: number; centerName: string; start: string; end: string; qty: string };
const todayStr = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

type Entity = "center" | "branch" | "item";
type Draft = { entity: Entity; id: number | null; centerId: number | null; name: string; price: string; guestPrice: string; entryCode: string; isActive: boolean };

const LABEL: Record<Entity, string> = { center: "센터", branch: "지점", item: "항목" };
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 설정 > 크루권: 센터 · 지점 · 항목(사용 구분)과 금액을 추가/수정한다. 삭제 대신 '사용 안 함'으로 숨긴다. */
export default function TicketCatalogManager({ centers, ready, passes }: { centers: TicketCenter[]; ready: boolean; passes: PassView[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [pd, setPd] = useState<PassDraft | null>(null);
  const [endTouched, setEndTouched] = useState(false);

  const newPass = (c: TicketCenter) => { setErr(""); setEndTouched(false); const t = todayStr(); setPd({ id: null, centerId: c.id, centerName: c.name, start: t, end: addYear(t), qty: "" }); };
  const editPass = (c: TicketCenter, p: PassView) => { setErr(""); setEndTouched(true); setPd({ id: p.id, centerId: c.id, centerName: c.name, start: p.start_date, end: p.end_date, qty: String(p.quantity) }); };
  async function savePass(del = false) {
    if (!pd) return;
    if (del && !confirm("이 횟수 내역을 삭제할까요?")) return;
    setBusy(true);
    setErr("");
    try {
      const body = del ? { id: pd.id, delete: true } : { id: pd.id ?? undefined, centerId: pd.centerId, startDate: pd.start, endDate: pd.end, quantity: pd.qty };
      const res = await fetch("/api/admin/tickets/passes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) return router.replace("/admin/login");
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return setErr(data.error ?? "저장하지 못했어요");
      toast.success(del ? "삭제했어요" : pd.id ? "횟수를 수정했어요" : "횟수를 추가했어요");
      setPd(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const create = (entity: Entity, centerId: number | null = null) => { setErr(""); setDraft({ entity, id: null, centerId, name: "", price: "", guestPrice: "", entryCode: "", isActive: true }); };
  const edit = (entity: Entity, id: number, centerId: number | null, name: string, isActive: boolean, price = 0, guestPrice: number | null = null, entryCode = "") => {
    setErr("");
    setDraft({ entity, id, centerId, name, price: String(price), guestPrice: guestPrice === null ? "" : String(guestPrice), entryCode, isActive });
  };

  async function save() {
    if (!draft) return;
    setBusy(true);
    setErr("");
    try {
      const body: Record<string, unknown> = { entity: draft.entity, name: draft.name };
      if (draft.id !== null) { body.id = draft.id; body.isActive = draft.isActive; }
      else if (draft.entity !== "center") body.centerId = draft.centerId;
      if (draft.entity === "center") body.entryCode = draft.entryCode; // 비우면 입장코드 없음
      if (draft.entity === "item") {
        body.price = draft.price === "" ? undefined : Number(draft.price.replaceAll(",", ""));
        body.guestPrice = draft.guestPrice === "" ? null : Number(draft.guestPrice); // 비우면 크루원 단가와 같음
      }
      const res = await fetch("/api/admin/tickets/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) return router.replace("/admin/login");
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return setErr(data.error ?? "저장하지 못했어요");
      toast.success(draft.id !== null ? `${LABEL[draft.entity]}을(를) 수정했어요` : `${LABEL[draft.entity]}을(를) 추가했어요`);
      setDraft(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      {!ready && (
        <p className="rounded-[10px] bg-amber-100 p-3 text-sm text-amber-950">크루권 저장소가 아직 없어요. Supabase에서 <b className="font-semibold">0008_tickets.sql</b>을 실행해 주세요.</p>
      )}
      <Button className="w-full" onClick={() => create("center")} disabled={!ready}><Plus /> 센터 추가</Button>

      {centers.map((c) => (
        <Card key={c.id} className="gap-0 py-4">
          <CardHeader className="flex items-center justify-between gap-2 px-4">
            <CardTitle className={cn("flex items-center gap-2 text-base", !c.is_active && "text-muted-foreground")}>
              {c.name}
              {!c.is_active && <Badge variant="outline" className="bg-muted">숨김</Badge>}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => edit("center", c.id, null, c.name, c.is_active, 0, null, c.entry_code ?? "")}>수정</Button>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 pt-3">
            <p className="text-[13px] text-muted-foreground">입장코드 <span className="font-semibold text-foreground">{c.entry_code || "미입력"}</span></p>
            <section aria-label={`${c.name} 지점`}>
              <h3 className="mb-2 text-[13px] font-semibold text-muted-foreground">지점</h3>
              <div className="flex flex-wrap gap-2">
                {c.branches.map((b) => (
                  <Button key={b.id} variant="outline" size="sm" onClick={() => edit("branch", b.id, c.id, b.name, b.is_active)} className={cn(!b.is_active && "text-muted-foreground line-through")}>
                    {b.name}
                  </Button>
                ))}
                <Button variant="secondary" size="sm" onClick={() => create("branch", c.id)}><Plus /> 지점 추가</Button>
              </div>
              {c.branches.length === 0 && <p className="mt-2 text-xs text-muted-foreground">지점이 없으면 신청할 때 지점 선택 없이 접수돼요.</p>}
            </section>

            <section aria-label={`${c.name} 횟수`}>
              <h3 className="mb-1 text-[13px] font-semibold text-muted-foreground">횟수 (신청 인원만큼 차감)</h3>
              <ul className="divide-y">
                {passes.filter((p) => p.center_id === c.id).map((p) => {
                  const left = Math.max(0, p.quantity - p.used);
                  return (
                    <li key={p.id} className="flex min-h-12 items-center gap-2 py-1.5">
                      <span className="min-w-0 flex-1 text-sm leading-snug">
                        <span className="font-semibold">{p.start_date.replaceAll("-", ".")} ~ {p.end_date.replaceAll("-", ".")}</span>
                        <span className="block text-xs text-muted-foreground">{p.quantity}회 중 {p.used}회 사용 · <b className="font-semibold text-foreground">{left}회 남음</b>{p.end_date < todayStr() && " · 기간 만료"}</span>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => editPass(c, p)}>수정</Button>
                    </li>
                  );
                })}
              </ul>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => newPass(c)}><Plus /> 횟수 추가</Button>
            </section>

            <section aria-label={`${c.name} 항목과 금액`}>
              <h3 className="mb-1 text-[13px] font-semibold text-muted-foreground">항목 · 금액 (1인 기준, 모든 지점 동일)</h3>
              <ul className="divide-y">
                {c.items.map((i) => (
                  <li key={i.id} className="flex min-h-12 items-center gap-2 py-1.5">
                    <span className={cn("min-w-0 flex-1 text-sm font-semibold", !i.is_active && "text-muted-foreground line-through")}>{i.name}</span>
                    <span className="text-right text-sm leading-snug">{won(i.price)}{i.guest_price !== null && i.guest_price !== i.price && <span className="block text-xs text-muted-foreground">게스트 {won(i.guest_price)}</span>}</span>
                    <Button variant="outline" size="sm" onClick={() => edit("item", i.id, c.id, i.name, i.is_active, i.price, i.guest_price)}>수정</Button>
                  </li>
                ))}
              </ul>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => create("item", c.id)}><Plus /> 항목 추가</Button>
            </section>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!pd} onOpenChange={(o) => !o && setPd(null)}>
        <DialogContent className="max-w-[380px]">
          {pd && (
            <>
              <DialogHeader>
                <DialogTitle>{pd.centerName} 횟수 {pd.id ? "수정" : "추가"}</DialogTitle>
                <DialogDescription className="sr-only">크루권 횟수의 기간과 수량을 입력합니다</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5">
                <div className="grid gap-1.5">
                  <Label htmlFor="p-start">시작일</Label>
                  <Input id="p-start" type="date" value={pd.start} onChange={(e) => { const v = e.target.value; setPd({ ...pd, start: v, end: !endTouched && v ? addYear(v) : pd.end }); }} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="p-end">종료일</Label>
                  <Input id="p-end" type="date" value={pd.end} min={pd.start} onChange={(e) => { setEndTouched(true); setPd({ ...pd, end: e.target.value }); }} />
                  <p className="text-xs text-muted-foreground">기본값은 시작일의 1년 뒤예요.</p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="p-qty">수량 (회)</Label>
                  <Input id="p-qty" inputMode="numeric" value={pd.qty} onChange={(e) => setPd({ ...pd, qty: e.target.value.replace(/[^\d]/g, "") })} placeholder="예) 100" />
                </div>
                {err && <p className="text-[13px] font-medium text-destructive" role="status">{err}</p>}
              </div>
              <DialogFooter className="flex-row gap-2.5">
                {pd.id !== null && <Button variant="outline" className="text-destructive" disabled={busy} onClick={() => savePass(true)}>삭제</Button>}
                <Button variant="outline" className="flex-1" onClick={() => setPd(null)}>취소</Button>
                <Button className="flex-1" disabled={busy} onClick={() => savePass()}>저장</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-[380px]">
          {draft && (
            <>
              <DialogHeader>
                <DialogTitle>{LABEL[draft.entity]} {draft.id !== null ? "수정" : "추가"}</DialogTitle>
                <DialogDescription className="sr-only">크루권 {LABEL[draft.entity]} 정보를 입력합니다</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5">
                <div className="grid gap-1.5">
                  <Label htmlFor="c-name">{LABEL[draft.entity]} 이름</Label>
                  <Input id="c-name" autoFocus maxLength={30} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={draft.entity === "item" ? "예) 크루 모임" : draft.entity === "branch" ? "예) 구로점" : "예) 서울숲"} />
                </div>
                {draft.entity === "center" && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-entry">입장코드</Label>
                    <Input id="c-entry" maxLength={100} value={draft.entryCode} onChange={(e) => setDraft({ ...draft, entryCode: e.target.value })} placeholder="예) 1234* (비우면 표시 안 함)" />
                    <p className="text-xs text-muted-foreground">크루권 신청 목록 화면에 센터별로 보여줘요.</p>
                  </div>
                )}
                {draft.entity === "item" && (
                  <>
                    <div className="grid gap-1.5">
                      <Label htmlFor="c-price">크루원 금액 (1인, 원)</Label>
                      <Input id="c-price" inputMode="numeric" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/[^\d]/g, "") })} placeholder="16000" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="c-guest-price">게스트 금액 (1인, 원)</Label>
                      <Input id="c-guest-price" inputMode="numeric" value={draft.guestPrice} onChange={(e) => setDraft({ ...draft, guestPrice: e.target.value.replace(/[^\d]/g, "") })} placeholder="비우면 크루원 금액과 같아요" />
                      {draft.id !== null && <p className="text-xs text-muted-foreground">금액을 바꿔도 이미 접수된 신청의 금액은 그대로예요.</p>}
                    </div>
                  </>
                )}
                {draft.id !== null && (
                  <label className="flex items-center gap-2.5 text-sm">
                    <Checkbox className="size-5" checked={!draft.isActive} onCheckedChange={(v) => setDraft({ ...draft, isActive: v !== true })} />
                    사용 안 함 (신청 화면에서 숨김)
                  </label>
                )}
                {err && <p className="text-[13px] font-medium text-destructive" role="status">{err}</p>}
              </div>
              <DialogFooter className="flex-row gap-2.5">
                <Button variant="outline" className="flex-1" onClick={() => setDraft(null)}>취소</Button>
                <Button className="flex-1" disabled={busy} onClick={save}>저장</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
