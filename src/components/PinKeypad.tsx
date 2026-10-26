"use client";

import { useState } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/** 4자리 입력 점 + 숫자 키패드. 4자리가 차면 onComplete 를 부르고 입력을 비운다(로그인 화면 PinPad 와 같은 모양). */
export default function PinKeypad({ onComplete, disabled = false }: { onComplete: (pin: string) => void; disabled?: boolean }) {
  const [pin, setPin] = useState("");
  function press(k: string) {
    if (disabled) return;
    if (k === "del") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    const next = pin + k;
    if (next.length < 4) return setPin(next);
    setPin("");
    onComplete(next);
  }
  return (
    <>
      <div className="mt-6 mb-2 flex justify-center gap-4" role="img" aria-label={`${pin.length}자리 입력됨`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("size-4 rounded-full border-2 border-primary", i < pin.length && "bg-primary")} />
        ))}
      </div>
      <div className="mt-4 grid w-full grid-cols-3 gap-2">
        {KEYS.map((k, i) =>
          k === "" ? (
            <div key={i} aria-hidden="true" />
          ) : (
            <Button
              key={i}
              variant="ghost"
              disabled={disabled}
              aria-label={k === "del" ? "지우기" : k}
              onClick={() => press(k)}
              className="h-16 rounded-[10px] border-0 bg-secondary text-2xl font-normal hover:bg-secondary active:bg-neutral-300"
            >
              {k === "del" ? <Delete className="size-6" /> : k}
            </Button>
          ),
        )}
      </div>
    </>
  );
}
