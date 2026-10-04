"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function PinPad({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(value: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/viewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      if (data.locked) {
        setLocked(true);
        const min = Math.max(1, Math.ceil((data.retryAfterSec ?? 600) / 60));
        setMsg(`요청이 너무 많아요. 약 ${min}분 뒤에 다시 시도해 주세요.`);
      } else if (res.status === 401) {
        setFailed(true);
        setMsg("비밀번호가 맞지 않아요");
      } else {
        setMsg("일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setMsg("네트워크 오류가 발생했어요.");
    } finally {
      setPin("");
      setBusy(false);
    }
  }

  function press(k: string) {
    if (locked || busy) return;
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const nextPin = pin + k;
    setMsg("");
    setPin(nextPin);
    if (nextPin.length === 4) void submit(nextPin);
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-2 px-7 pt-14 pb-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="도파민즈 크루" width={820} height={216} className="h-auto w-[180px]" />
      <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">도파민즈 크루 전용 서비스입니다<br />비밀번호 4자리를 입력해주세요</p>
      <div className="mt-7 mb-2 flex gap-4" role="img" aria-label={`${pin.length}자리 입력됨`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("size-4 rounded-full border-2 border-primary", i < pin.length && "bg-primary")} />
        ))}
      </div>
      <div className="min-h-[22px] text-center text-[13px] font-normal text-destructive" role="status">{msg}</div>
      <div className="mt-2 grid w-full grid-cols-3 gap-2">
        {KEYS.map((k, i) =>
          k === "" ? (
            <div key={i} aria-hidden="true" />
          ) : (
            <Button
              key={i}
              variant="ghost"
              disabled={locked || busy}
              aria-label={k === "del" ? "지우기" : k}
              onClick={() => press(k)}
              className="h-16 rounded-[10px] border-0 bg-secondary text-2xl font-normal hover:bg-secondary active:bg-neutral-300"
            >
              {k === "del" ? <Delete className="size-6" /> : k}
            </Button>
          ),
        )}
      </div>
      {failed && (
        <p className="mt-auto pt-6 text-center text-[13px] text-muted-foreground" role="note">
          비밀번호를 모를 경우 운영진에게 문의주세요
        </p>
      )}
    </main>
  );
}
