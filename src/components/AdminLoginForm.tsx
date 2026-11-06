"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy || locked) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      if (res.status === 401 && data.error === "unauthorized") {
        router.replace("/login");
        return;
      }
      if (data.locked) {
        setLocked(true);
        const min = Math.max(1, Math.ceil((data.retryAfterSec ?? 600) / 60));
        setMsg(`요청이 너무 많아요. 약 ${min}분 뒤에 다시 시도해 주세요.`);
      } else if (res.status === 401) {
        setMsg("비밀번호가 맞지 않아요");
      } else {
        setMsg("일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setMsg("네트워크 오류가 발생했어요.");
    } finally {
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-2 px-7 pt-14 pb-7">
      <h1 className="mt-2 text-[22px] font-semibold">관리자 모드</h1>
      <p className="text-sm text-muted-foreground">운영진 비밀번호를 입력해 주세요</p>
      <form className="mt-4 flex flex-col gap-2" onSubmit={onSubmit}>
        <Label htmlFor="admin-pw">관리자 비밀번호</Label>
        <Input id="admin-pw" type="password" autoComplete="off" placeholder="영문 + 숫자 + 특수기호" value={password} onChange={(e) => setPassword(e.target.value)} disabled={locked} />
        <div className="min-h-[22px] text-[13px] font-normal text-destructive" role="status">{msg}</div>
        <div className="flex gap-2.5">
          <Button asChild variant="outline" className="flex-1"><Link href="/">취소</Link></Button>
          <Button type="submit" disabled={busy || locked || !password} className="flex-[2]">관리자 모드 진입</Button>
        </div>
      </form>
    </main>
  );
}
