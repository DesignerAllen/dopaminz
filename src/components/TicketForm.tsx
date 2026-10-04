"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import CopyAccount from "./CopyAccount";
import MemberCombobox from "./MemberCombobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TicketCenter } from "@/lib/tickets";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 크루권 신청 폼(크루원). 이용자는 크루원(검색·선택)과 게스트(직접 입력)를 여러 명 넣을 수 있다. */
export default function TicketForm({ centers, members, today, account }: {
  centers: TicketCenter[];
  members: { id: number; name: string }[];
  today: string;
  account: string;
}) {
  const router = useRouter();
  const [usedOn, setUsedOn] = useState(today);
  const [centerId, setCenterId] = useState<number | null>(centers[0]?.id ?? null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [itemId, setItemId] = useState<number | null>(centers[0]?.items[0]?.id ?? null);
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [guestErr, setGuestErr] = useState("");

  const center = centers.find((c) => c.id === centerId) ?? null;
  const item = center?.items.find((i) => i.id === itemId) ?? null;
  const branch = center?.branches.find((b) => b.id === branchId) ?? null;
  const needBranch = (center?.branches.length ?? 0) > 0;
  const count = memberIds.length + guests.length;
  // 크루원은 항목 단가, 게스트는 게스트 단가(없으면 크루원 단가와 같음)
  const memberPrice = item?.price ?? 0;
  const guestPrice = item ? (item.guest_price ?? item.price) : 0;
  const total = memberPrice * memberIds.length + guestPrice * guests.length;
  const priceText = (i: { price: number; guest_price: number | null }) =>
    i.guest_price !== null && i.guest_price !== i.price ? `크루원 ${won(i.price)} · 게스트 ${won(i.guest_price)}` : won(i.price);
  const available = useMemo(() => members.filter((m) => !memberIds.includes(m.id)), [members, memberIds]);
  const nameOf = (id: number) => members.find((m) => m.id === id)?.name ?? "";
  const canSubmit = !busy && !!usedOn && !!center && !!item && (!needBranch || branchId !== null) && count > 0;

  function pickCenter(v: string) {
    const c = centers.find((x) => x.id === Number(v));
    setCenterId(c?.id ?? null);
    setBranchId(null);
    setItemId(c?.items[0]?.id ?? null);
  }
  function addGuest() {
    const name = guestInput.trim();
    if (!name) return;
    if (name.length > 20) return setGuestErr("게스트 이름은 20자 이내로 입력해 주세요");
    if (guests.includes(name)) return setGuestErr("이미 추가한 게스트예요");
    setGuestErr("");
    setGuests([...guests, name]);
    setGuestInput("");
  }

  async function submit() {
    if (!canSubmit || !center || !item) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usedOn, centerId: center.id, branchId, itemId: item.id, memberIds, guests }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) return router.replace("/login?next=/tickets/new");
      if (!res.ok) return setErr(data.error ?? "신청하지 못했어요. 다시 시도해 주세요");
      toast.success("크루권을 신청했어요");
      router.replace("/tickets");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (centers.length === 0) {
    return <p className="mx-4 mt-4 rounded-[10px] border bg-card p-8 text-center text-sm text-muted-foreground">신청할 수 있는 센터가 아직 없어요. 운영진에게 문의해 주세요.</p>;
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-10">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
        <Label htmlFor="t-date">사용일</Label>
        <Input id="t-date" type="date" value={usedOn} onChange={(e) => setUsedOn(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="grid gap-1.5">
          <Label htmlFor="t-center">센터</Label>
          <Select value={centerId ? String(centerId) : ""} onValueChange={pickCenter}>
            <SelectTrigger id="t-center" className="w-full"><SelectValue placeholder="센터 선택">{center?.name}</SelectValue></SelectTrigger>
            <SelectContent>{centers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="t-branch">지점</Label>
          <Select value={branchId ? String(branchId) : ""} onValueChange={(v) => setBranchId(Number(v))} disabled={!needBranch}>
            <SelectTrigger id="t-branch" className="w-full"><SelectValue placeholder={needBranch ? "지점 선택" : "지점 없음"}>{center?.branches.find((b) => b.id === branchId)?.name}</SelectValue></SelectTrigger>
            <SelectContent>{center?.branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>사용 구분</Label>
        <RadioGroup value={itemId ? String(itemId) : ""} onValueChange={(v) => setItemId(Number(v))} className="gap-2">
          {center?.items.map((i) => (
            <label key={i.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border bg-card px-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent">
              <RadioGroupItem value={String(i.id)} />
              <span className="flex-1 text-sm font-semibold">{i.name}</span>
              <span className="text-right text-[13px] leading-snug text-muted-foreground">{priceText(i)}</span>
            </label>
          ))}
          {center && center.items.length === 0 && <p className="text-sm text-muted-foreground">이 센터는 아직 사용 구분이 없어요.</p>}
        </RadioGroup>
      </div>

      <div className="grid gap-2">
        <Label>이용자 <span className="font-normal text-muted-foreground">(여러 명 가능)</span></Label>
        <div className="flex">
          <MemberCombobox
            options={available}
            selectedId={null}
            onSelect={(id) => id !== null && setMemberIds((p) => (p.includes(id) ? p : [...p, id]))}
            query={q}
            onQuery={setQ}
            label="크루원 검색"
            placeholder="크루원 검색 후 선택"
          />
        </div>
        <div className="flex gap-2">
          <Input
            value={guestInput}
            maxLength={20}
            onChange={(e) => { setGuestInput(e.target.value); setGuestErr(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } }}
            placeholder="게스트 이름 입력"
            aria-label="게스트 이름"
          />
          <Button variant="outline" onClick={addGuest} className="flex-none"><Plus /> 추가</Button>
        </div>
        {guestErr && <p className="text-[13px] font-medium text-destructive" role="status">{guestErr}</p>}
        {count > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {memberIds.map((id) => (
              <Badge key={`m${id}`} variant="secondary" className="h-8 gap-1 pr-1 pl-2.5 text-[13px]">
                {nameOf(id)}
                <button type="button" aria-label={`${nameOf(id)} 삭제`} onClick={() => setMemberIds(memberIds.filter((x) => x !== id))} className="grid size-6 place-items-center rounded-full hover:bg-black/10"><X className="size-3.5" /></button>
              </Badge>
            ))}
            {guests.map((g) => (
              <Badge key={`g${g}`} variant="outline" className="h-8 gap-1 pr-1 pl-2.5 text-[13px]">
                {g} <span className="text-muted-foreground">게스트</span>
                <button type="button" aria-label={`${g} 삭제`} onClick={() => setGuests(guests.filter((x) => x !== g))} className="grid size-6 place-items-center rounded-full hover:bg-black/10"><X className="size-3.5" /></button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-[13px] text-muted-foreground">총 <b className="font-semibold text-foreground">{count}명</b> (크루원 {memberIds.length} · 게스트 {guests.length})</p>
      </div>

      {/* 센터·지점 금액 요약 + 입금 계좌 (한 카드) */}
      <div className="mt-5 grid gap-6 rounded-[10px] border bg-card p-4">
        <section aria-label="금액">
          <h2 className="text-base font-semibold">{center?.name}{branch ? ` ${branch.name}` : ""}</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt>크루원 <b className="font-semibold">{memberIds.length}명</b></dt>
              <dd>{won(memberPrice)} <span className="text-xs text-muted-foreground">/ 1인</span></dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt>게스트 <b className="font-semibold">{guests.length}명</b></dt>
              <dd>{won(guestPrice)} <span className="text-xs text-muted-foreground">/ 1인</span></dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 rounded-lg bg-muted px-3 py-2.5">
              <dt className="text-[13px] text-muted-foreground">총 입금 금액</dt>
              <dd className="text-lg font-semibold">{won(total)}</dd>
            </div>
          </dl>
        </section>

        {account && (
          <section aria-label="입금 계좌">
            <h2 className="text-base font-semibold">입금 계좌</h2>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">신청 후 위 금액을 아래 계좌로 입금해 주세요. 입금자명은 반드시 신청자 이름과 동일하게 해주세요</p>
            <div className="mt-3"><CopyAccount account={account} light /></div>
          </section>
        )}
      </div>

      {err && <p className="text-[13px] font-medium text-destructive" role="status">{err}</p>}
      <Button size="lg" className="w-full" disabled={!canSubmit} onClick={submit}>{busy ? "제출 중…" : "제출"}</Button>
    </div>
  );
}
