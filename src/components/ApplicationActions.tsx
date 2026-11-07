"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "신규" | "가입완료" | "반려";

/** 신청서 상세의 처리 버튼: 회원등록(회원 등록 모달) · 반려/반려취소 · 삭제 */
export default function ApplicationActions({ id, status, name, instagram, today }: { id: number; status: Status; name: string; instagram: string; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name, joined: today, insta: instagram });
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => { setOpen(false); setErr(""); setWarn(null); };
  const openRegister = () => { setF({ name, joined: today, insta: instagram }); setErr(""); setWarn(null); setOpen(true); };

  async function call(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: { error?: string; warnings?: string[] } }> {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    if (res.status === 401) { router.replace("/admin/login"); return { ok: false, status: 401, data: {} }; }
    return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as { error?: string; warnings?: string[] } };
  }

  async function register(force = false) {
    setBusy(true);
    setErr("");
    try {
      const r = await call(`/api/admin/applications/${id}/register`, { method: "POST", body: JSON.stringify({ name: f.name, joined_at: f.joined, instagram_id: f.insta, force }) });
      if (r.status === 409 && r.data.warnings) return setWarn(r.data.warnings);
      if (!r.ok) return setErr(r.data.error && r.data.error !== "db" ? r.data.error : "등록하지 못했어요");
      toast.success(`${f.name} 회원을 등록했어요`);
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(next: "반려" | "신규") {
    setBusy(true);
    try {
      const r = await call(`/api/admin/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      if (!r.ok) return toast.error(r.data.error && r.data.error !== "db" ? r.data.error : "처리하지 못했어요");
      toast.success(next === "반려" ? "반려 처리했어요" : "반려를 취소했어요");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const extra = status === "가입완료" ? "\n(이미 등록된 회원은 그대로 남아요)" : "";
    if (!window.confirm(`${name}님의 신청서를 삭제할까요?\n삭제하면 되돌릴 수 없어요.${extra}`)) return;
    setBusy(true);
    try {
      const r = await call(`/api/admin/applications/${id}`, { method: "DELETE" });
      if (!r.ok) return toast.error("삭제하지 못했어요");
      toast.success("신청서를 삭제했어요");
      router.replace("/admin/applications");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2 px-4 pb-3">
      {status === "신규" && <Button className="h-12 w-full text-base" disabled={busy} onClick={openRegister}>회원등록</Button>}
      {status === "신규" && <Button variant="outline" className="w-full" disabled={busy} onClick={() => setStatus("반려")}>반려</Button>}
      {status === "반려" && <Button variant="outline" className="w-full" disabled={busy} onClick={() => setStatus("신규")}>반려취소</Button>}
      <Button variant="outline" className="w-full text-destructive" disabled={busy} onClick={remove}>삭제</Button>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90dvh] max-w-[380px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원 등록</DialogTitle>
            <DialogDescription className="sr-only">신청서 내용으로 새 회원을 등록합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3.5">
            <div className="grid gap-1.5">
              <Label htmlFor="r-name">이름 (필수)</Label>
              <Input id="r-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-joined">가입일 (필수)</Label>
              <Input id="r-joined" type="date" value={f.joined} onChange={(e) => setF({ ...f, joined: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-insta">인스타그램 ID (선택)</Label>
              <Input id="r-insta" value={f.insta} onChange={(e) => setF({ ...f, insta: e.target.value })} placeholder="@ 없이, 영문·숫자·.·_ 30자 이내" />
            </div>
            {err && <p className="text-[13px] text-destructive" role="status">{err}</p>}
            {warn && (
              <Alert className="border-0 bg-[#fff9e7] text-[#191f28]">
                <TriangleAlert />
                <AlertDescription className="text-[#191f28]">
                  {warn.map((w) => <div key={w}>· {w}</div>)}
                  <Button variant="outline" className="mt-2 w-full" disabled={busy} onClick={() => register(true)}>확인했어요, 그대로 등록</Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex-row gap-2.5">
            <Button variant="outline" className="flex-1" onClick={close}>취소</Button>
            <Button className="flex-1" disabled={busy} onClick={() => register(false)}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
