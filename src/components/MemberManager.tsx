"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import MemberCombobox from "./MemberCombobox";
import SortSelect from "./SortSelect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEFAULT_SORT, sortMembers, type SortKey } from "@/lib/member-sort";

type M = { id: number; name: string; joined_at: string; instagram_id: string | null; hidden_reason: string | null; hidden_at: string | null };
const REASONS = ["자진 탈퇴", "경고 탈퇴", "기타"] as const;

// 모달에서 편집 중인 값. id 가 없으면 신규 등록.
type Draft = { id: number | null; name: string; joined: string; insta: string; status: "회원" | "미노출"; reason: string; hiddenAt: string; wasHidden: boolean };
const blank: Draft = { id: null, name: "", joined: "", insta: "", status: "회원", reason: "", hiddenAt: "", wasHidden: false };

export default function MemberManager({ active, hidden, warnings, today }: { active: M[]; hidden: M[]; warnings: string[]; today: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const [confirmWarn, setConfirmWarn] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const kw = q.trim();
  const shownActive = sortMembers(sel !== null ? active.filter((m) => m.id === sel) : kw ? active.filter((m) => m.name.includes(kw)) : active, sort);

  const close = () => {
    setDraft(null);
    setErr("");
    setConfirmWarn(null);
  };
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const openCreate = () => { setErr(""); setConfirmWarn(null); setDraft({ ...blank }); };
  const openEdit = (m: M, isHidden: boolean) => {
    setErr(""); setConfirmWarn(null);
    setDraft({
      id: m.id, name: m.name, joined: m.joined_at, insta: m.instagram_id ?? "",
      status: isHidden ? "미노출" : "회원", reason: m.hidden_reason ?? "", hiddenAt: m.hidden_at ?? "", wasHidden: isHidden,
    });
  };

  async function save(force = false) {
    if (!draft) return;
    setBusy(true);
    setErr("");
    try {
      const body: Record<string, unknown> = { name: draft.name, joined_at: draft.joined, instagram_id: draft.insta, force };
      if (draft.id) {
        body.status = draft.status;
        if (draft.status === "미노출") {
          body.reason = draft.reason;
          body.hidden_at = draft.hiddenAt;
        }
      }
      const res = await fetch(draft.id ? `/api/admin/members/${draft.id}` : "/api/admin/members", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) return router.replace("/admin/login");
      const data = (await res.json().catch(() => ({}))) as { error?: string; warnings?: string[] };
      if (res.status === 409 && data.warnings) return setConfirmWarn(data.warnings);
      if (!res.ok) return setErr(data.error ?? "저장하지 못했어요");
      toast.success(draft.id ? `${draft.name} 정보를 저장했어요` : `${draft.name} 회원을 등록했어요`);
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 pt-3 pb-10">
      {warnings.length > 0 && (
        <Alert className="mb-3 border-amber-300 bg-amber-100 text-amber-950">
          <TriangleAlert />
          <AlertDescription className="text-amber-950">
            <b>확인 필요</b> — 가입일 이전 달에 납부 기록이 있어요
            {warnings.map((w) => <div key={w}>· {w}</div>)}
          </AlertDescription>
        </Alert>
      )}

      <Button className="w-full" onClick={openCreate}>+ 회원 등록</Button>

      <h2 className="mt-5 mb-2 px-0.5 text-base font-semibold">회원 <span className="text-sm font-normal text-muted-foreground">{active.length}명</span></h2>
      <div className="mb-2.5 flex items-start gap-2">
        <SortSelect value={sort} onChange={setSort} />
        <MemberCombobox options={active} selectedId={sel} onSelect={setSel} query={q} onQuery={setQ} />
      </div>
      <ul className="divide-y overflow-hidden rounded-[10px] border bg-card">
        {shownActive.map((m) => (
          <li key={m.id} className="flex min-h-15 items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">{m.name}</div>
              <div className="text-xs text-muted-foreground">가입 {m.joined_at}{m.instagram_id ? ` · @${m.instagram_id}` : ""}</div>
            </div>
            <Button variant="outline" size="sm" className="h-11" onClick={() => openEdit(m, false)}>수정</Button>
          </li>
        ))}
        {shownActive.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">{active.length === 0 ? "회원이 없어요" : "검색 결과가 없어요"}</li>}
      </ul>

      <h2 className="mt-6 mb-1 px-0.5 text-base font-semibold">미노출 회원 <span className="text-sm font-normal text-muted-foreground">{hidden.length}명</span></h2>
      <p className="mb-2 px-0.5 text-xs text-muted-foreground">뷰어에게는 보이지 않아요. 납부 기록은 보존되고 집계에서만 제외돼요.</p>
      {REASONS.map((r) => {
        const items = hidden.filter((m) => m.hidden_reason === r);
        return (
          <section key={r} className="mb-2.5 overflow-hidden rounded-[10px] border bg-card">
            <div className="bg-secondary px-3.5 py-2 text-[13px] font-semibold text-foreground/80">{r} · {items.length}명</div>
            <ul className="divide-y">
              {items.map((m) => (
                <li key={m.id} className="flex min-h-14 items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold">{m.name}</div>
                    <div className="text-xs text-muted-foreground">가입 {m.joined_at} · 미노출일 {m.hidden_at ?? "-"}</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-11" onClick={() => openEdit(m, true)}>수정</Button>
                </li>
              ))}
              {items.length === 0 && <li className="px-3.5 py-3 text-[13px] text-muted-foreground">해당 회원 없음</li>}
            </ul>
          </section>
        );
      })}

      <Dialog open={!!draft} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90dvh] max-w-[380px] overflow-y-auto">
          {draft && (
            <>
              <DialogHeader>
                <DialogTitle>{draft.id ? "회원 수정" : "회원 등록"}</DialogTitle>
                <DialogDescription className="sr-only">{draft.id ? "회원 정보와 상태를 수정합니다" : "새 회원을 등록합니다"}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5">
                <div className="grid gap-1.5">
                  <Label htmlFor="m-name">이름 (필수)</Label>
                  <Input id="m-name" autoFocus={!draft.id} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="예) 홍길동" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="m-joined">가입일 (필수)</Label>
                  <Input id="m-joined" type="date" value={draft.joined} onChange={(e) => set({ joined: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="m-insta">인스타그램 ID (선택)</Label>
                  <Input id="m-insta" value={draft.insta} onChange={(e) => set({ insta: e.target.value })} placeholder="@ 없이, 영문·숫자·.·_ 30자 이내" />
                </div>

                {draft.id && (
                  <>
                    <div className="grid gap-1.5">
                      <Label>상태</Label>
                      <ToggleGroup
                        type="single" variant="outline" spacing={0} aria-label="상태" className="w-full"
                        value={draft.status}
                        onValueChange={(s) => {
                          if (s === "회원") set({ status: "회원" });
                          else if (s === "미노출") set({ status: "미노출", reason: draft.reason || REASONS[0], hiddenAt: draft.wasHidden ? draft.hiddenAt : draft.hiddenAt || today });
                        }}
                      >
                        {(["회원", "미노출"] as const).map((s) => (
                          <ToggleGroupItem key={s} value={s} className="h-11 flex-1 data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground">{s}</ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                    {draft.status === "미노출" && (
                      <>
                        <div className="grid gap-1.5">
                          <Label htmlFor="m-reason">미노출 사유</Label>
                          <Select value={draft.reason} onValueChange={(v) => set({ reason: v })}>
                            <SelectTrigger id="m-reason" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="m-hidden-at">미노출일 (비워둘 수 있어요)</Label>
                          <Input id="m-hidden-at" type="date" value={draft.hiddenAt} min={draft.joined || undefined} onChange={(e) => set({ hiddenAt: e.target.value })} />
                        </div>
                      </>
                    )}
                  </>
                )}

                {err && <p className="text-[13px] font-normal text-destructive" role="status">{err}</p>}

                {confirmWarn && (
                  <Alert className="border-amber-300 bg-amber-100 text-amber-950">
                    <TriangleAlert />
                    <AlertDescription className="text-amber-950">
                      {confirmWarn.map((w) => <div key={w}>· {w}</div>)}
                      <Button variant="outline" className="mt-2 w-full" disabled={busy} onClick={() => save(true)}>확인했어요, 그대로 저장</Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter className="flex-row gap-2.5">
                <Button variant="outline" className="flex-1" onClick={close}>취소</Button>
                <Button className="flex-1" disabled={busy} onClick={() => save(false)}>{draft.id ? "저장" : "등록"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
