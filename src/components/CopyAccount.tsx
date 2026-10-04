"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

/** 표시는 입력한 그대로(예: "79423663893 카카오뱅크"), 복사는 계좌번호 숫자 부분만 한다. */
/** light: 밝은 바탕에서 쓸 때(기본은 어두운 박스 안) */
export default function CopyAccount({ account, light = false }: { account: string; light?: boolean }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const number = account.match(/\d[\d-]{5,}/)?.[0] ?? account;

  async function copy() {
    const ok = await copyText(number);
    setState(ok ? "done" : "fail");
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copy}
      aria-label={`계좌번호 ${number} 복사`}
      className={light ? "h-9 flex-none gap-1.5 bg-background px-2.5 text-[13px]" : "h-9 flex-none gap-1.5 border-white/55 bg-white/10 px-2.5 text-[13px] text-white hover:bg-white/20 hover:text-white"}
    >
      <span role="status">{state === "done" ? "복사됐어요!" : state === "fail" ? "복사하지 못했어요" : account}</span>
      {state === "done" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
