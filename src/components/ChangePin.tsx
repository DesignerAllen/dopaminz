"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PinKeypad from "@/components/PinKeypad";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = "current" | "next" | "confirm";
const STEPS: { key: Step; label: string; title: string; hint: string }[] = [
  { key: "current", label: "현재 비밀번호", title: "현재 비밀번호를 입력해 주세요", hint: "지금 사용 중인 4자리예요" },
  { key: "next", label: "새 비밀번호", title: "새 비밀번호를 입력해 주세요", hint: "앞으로 사용할 숫자 4자리예요" },
  { key: "confirm", label: "새 비밀번호 확인", title: "한 번 더 입력해 주세요", hint: "방금 입력한 새 비밀번호와 똑같이요" },
];

/** 개인 비밀번호 변경: 현재 비밀번호 → 새 비밀번호 → 새 비밀번호 확인 */
export default function ChangePin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("current");
  const [current, setCurrent] = useState("");
  const [first, setFirst] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const at = STEPS.findIndex((s) => s.key === step);

  function restart(message: string) {
    setCurrent("");
    setFirst("");
    setStep("current");
    setMsg(message);
  }

  async function onConfirm(pin: string) {
    if (pin !== first) {
      setFirst("");
      setStep("next");
      return setMsg("새 비밀번호가 서로 달라요. 다시 입력해 주세요");
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/member/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next: pin }),
      });
      if (res.ok) {
        toast.success("비밀번호를 바꿨어요");
        router.replace("/");
        router.refresh();
        return;
      }
      if (res.status === 401) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === "member_required") return router.replace("/login?next=/account/password");
        return restart("현재 비밀번호가 맞지 않아요");
      }
      if (res.status === 429) return restart("요청이 너무 많아요. 잠시 후 다시 시도해 주세요");
      restart("변경하지 못했어요. 잠시 후 다시 시도해 주세요");
    } catch {
      restart("네트워크 오류가 발생했어요");
    } finally {
      setBusy(false);
    }
  }

  const s = STEPS[at];
  return (
    <main className="flex flex-1 flex-col gap-2 px-6 pt-6 pb-7">
      <ol className="flex gap-1.5" aria-label="진행 단계">
        {STEPS.map((x, i) => (
          <li key={x.key} className="flex-1" aria-current={i === at ? "step" : undefined}>
            <div className={cn("h-1 rounded-full", i <= at ? "bg-primary" : "bg-secondary")} />
            <div className={cn("mt-1.5 text-xs", i === at ? "font-semibold text-primary" : "text-muted-foreground")}>{x.label}</div>
          </li>
        ))}
      </ol>
      <section className="mt-6 flex flex-col items-center">
        <h2 className="text-xl font-semibold">{s.title}</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">{s.hint}</p>
        <div className="mt-1 min-h-[22px] text-center text-[13px] text-destructive" role="status">{msg}</div>
        <PinKeypad
          disabled={busy}
          onComplete={(pin) => {
            setMsg("");
            if (step === "current") { setCurrent(pin); setStep("next"); }
            else if (step === "next") { setFirst(pin); setStep("confirm"); }
            else void onConfirm(pin);
          }}
        />
        {step !== "current" && <Button variant="ghost" className="mt-4" disabled={busy} onClick={() => restart("")}>처음부터 다시</Button>}
      </section>
    </main>
  );
}
