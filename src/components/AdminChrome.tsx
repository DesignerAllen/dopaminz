"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const IDLE_MS = 30 * 60 * 1000;

/** 관리자 모드 상단 바: 모드 표시 + 종료 버튼 + 30분 무활동 시 자동 종료 */
export default function AdminChrome() {
  const router = useRouter();
  const last = useRef(Date.now());
  const lastPing = useRef(Date.now());

  async function exit() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminOnly: true }) });
    router.replace("/");
    router.refresh();
  }

  useEffect(() => {
    const onActivity = () => {
      last.current = Date.now();
      if (Date.now() - lastPing.current > 60_000) {
        lastPing.current = Date.now();
        void fetch("/api/auth/ping", { method: "POST" });
      }
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const timer = setInterval(() => {
      if (Date.now() - last.current > IDLE_MS) void exit();
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-(--h-adminbar) items-center gap-2.5 bg-[#1b2a41] pr-2 pl-4 text-[13px] font-semibold text-white">
      <span className="size-2 flex-none rounded-full bg-[#f5b73b]" aria-hidden="true" />
      <span className="min-w-0 flex-1">관리자 모드</span>
      <Button variant="link" onClick={exit} className="h-full rounded-none px-2.5 text-[13px] font-normal text-[#c9d4e3] underline hover:text-white">
        모드 종료
      </Button>
    </div>
  );
}
