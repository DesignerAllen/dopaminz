"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pin, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Status = "노출" | "미노출";
type N = { id: string; title: string; content: string; created: string; updated: string | null; status: Status; pinned: boolean };
type Draft = { id: string | null; title: string; content: string; status: Status; pinned: boolean };

export default function NoticeManager({ notices, ready }: { notices: N[]; ready: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setDraft(null);
    setErr("");
  };

  async function save() {
    if (!draft) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(draft.id ? `/api/admin/notices/${draft.id}` : "/api/admin/notices", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draft.title, content: draft.content, status: draft.status, pinned: draft.pinned }),
      });
      if (res.status === 401) return router.replace("/admin/login");
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return setErr(data.error && data.error !== "db" ? data.error : "저장하지 못했어요");
      toast.success(draft.id ? "공지사항을 수정했어요" : "공지사항을 등록했어요");
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 pt-3 pb-10">
      {!ready && (
        <Alert className="mb-3 border-amber-300 bg-amber-100 text-amber-950">
          <TriangleAlert />
          <AlertDescription className="text-amber-950">공지사항 저장소가 아직 없어요. Supabase에서 <b>0004_announcements.sql</b>을 실행해 주세요.</AlertDescription>
        </Alert>
      )}
      <Button className="w-full" onClick={() => setDraft({ id: null, title: "", content: "", status: "노출", pinned: false })}>+ 공지 작성</Button>

      <h2 className="mt-5 mb-2 px-0.5 text-base font-semibold">공지사항 <span className="text-sm font-normal text-muted-foreground">{notices.length}개</span></h2>
      <ul className="divide-y overflow-hidden rounded-[10px] border bg-card">
        {notices.map((n) => (
          <li key={n.id} className="flex min-h-16 items-center gap-2 px-3 py-2">
            <Link href={`/admin/notices/${n.id}`} className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold">
                {n.pinned && <Pin className="size-3.5 flex-none text-primary" aria-label="상단 고정" />}
                <span className="min-w-0 truncate">{n.title}</span>
                {n.status === "미노출" && <Badge variant="outline" className="flex-none bg-muted text-foreground/75">미노출</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">작성 {n.created}{n.updated ? ` · 수정 ${n.updated}` : ""}</div>
            </Link>
            <Button variant="outline" size="sm" className="h-11" onClick={() => setDraft({ id: n.id, title: n.title, content: n.content, status: n.status, pinned: n.pinned })}>수정</Button>
          </li>
        ))}
        {notices.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">등록된 공지사항이 없어요</li>}
      </ul>

      <Dialog open={!!draft} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90dvh] max-w-[380px] overflow-y-auto">
          {draft && (
            <>
              <DialogHeader>
                <DialogTitle>{draft.id ? "공지 수정" : "공지 작성"}</DialogTitle>
                <DialogDescription className="sr-only">공지사항의 제목, 내용, 노출 상태, 상단 고정을 설정합니다</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5">
                <div className="grid gap-1.5">
                  <Label htmlFor="n-title">제목</Label>
                  <Input id="n-title" autoFocus maxLength={100} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="공지 제목" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="n-content">내용</Label>
                  <Textarea id="n-content" maxLength={5000} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="공지 내용을 입력하세요" />
                  <div className="text-right text-xs text-muted-foreground">{draft.content.length} / 5000</div>
                </div>
                <div className="grid gap-1.5">
                  <Label>노출 상태</Label>
                  <ToggleGroup type="single" variant="outline" spacing={0} aria-label="노출 상태" className="w-full" value={draft.status} onValueChange={(s) => s && setDraft({ ...draft, status: s as Status })}>
                    {(["노출", "미노출"] as const).map((s) => (
                      <ToggleGroupItem key={s} value={s} className="h-11 flex-1 data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground">{s}</ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <p className="text-xs text-muted-foreground">{draft.status === "노출" ? "크루원에게 공지로 보여요." : "크루원에게 보이지 않아요. 링크로도 열 수 없어요."}</p>
                </div>
                <label className="flex items-start gap-2.5 rounded-[10px] bg-accent p-2.5 text-[13px] leading-snug text-accent-foreground">
                  <Checkbox className="mt-0.5 size-5" checked={draft.pinned} onCheckedChange={(v) => setDraft({ ...draft, pinned: v === true })} />
                  <span><b>상단 고정</b> — 체크하면 공지 목록 맨 위에 고정돼요. 해제하면 작성일 순으로 돌아가요.</span>
                </label>
                {err && <p className="text-[13px] font-normal text-destructive" role="status">{err}</p>}
              </div>
              <DialogFooter className="flex-row gap-2.5">
                <Button variant="outline" className="flex-1" onClick={close}>취소</Button>
                <Button className="flex-1" disabled={busy} onClick={save}>{draft.id ? "저장" : "등록"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
