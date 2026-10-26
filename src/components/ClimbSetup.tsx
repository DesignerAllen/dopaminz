"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberCombobox from "@/components/MemberCombobox";
import PinKeypad from "@/components/PinKeypad";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoginMember = { id: number; name: string; hasPin: boolean };
type Step = "pick" | "pin" | "confirm";
const STEPS: { key: Step; label: string }[] = [
  { key: "pick", label: "크루원 선택" },
  { key: "pin", label: "비밀번호 등록" },
  { key: "confirm", label: "비밀번호 확인" },
];

/** 클메이트 시작 전 최초 1회: 크루원 선택 → 개인 비밀번호 등록 → 확인. 끝나면 그 크루원으로 로그인된 채 테스트로 이동한다. */
export default function ClimbSetup({ members }: { members: LoginMember[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [sel, setSel] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [first, setFirst] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const person = members.find((m) => m.id === sel) ?? null;
  const taken = !!person?.hasPin;

  async function loginInstead() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    router.replace("/login?next=/climbmate");
    router.refresh();
  }

  function onPin(pin: string) {
    setFirst(pin);
    setMsg("");
    setStep("confirm");
  }

  async function onConfirm(pin: string) {
    if (pin !== first) {
      setFirst("");
      setStep("pin");
      return setMsg("두 번 입력한 비밀번호가 달라요. 처음부터 다시 등록해 주세요");
    }
    if (!person) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/member/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: person.id, pin }),
      });
      if (res.ok) {
        router.replace("/climbmate/test");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setFirst("");
      if (res.status === 401) return router.replace("/login?next=/climbmate");
      if (data.error === "already_set") {
        setStep("pick");
        return setMsg("이미 비밀번호가 등록된 크루원이에요. 로그인 화면에서 이름을 검색해 로그인해 주세요");
      }
      setStep("pin");
      setMsg("등록하지 못했어요. 잠시 후 다시 시도해 주세요");
    } catch {
      setFirst("");
      setStep("pin");
      setMsg("네트워크 오류가 발생했어요");
    } finally {
      setBusy(false);
    }
  }

  const at = STEPS.findIndex((s) => s.key === step);
  return (
    <main className="flex flex-1 flex-col gap-2 px-6 pt-6 pb-7">
      <ol className="flex gap-1.5" aria-label="진행 단계">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex-1" aria-current={i === at ? "step" : undefined}>
            <div className={cn("h-1 rounded-full", i <= at ? "bg-primary" : "bg-secondary")} />
            <div className={cn("mt-1.5 text-xs", i === at ? "font-semibold text-primary" : "text-muted-foreground")}>{i + 1}. {s.label}</div>
          </li>
        ))}
      </ol>

      {step === "pick" && (
        <section className="mt-6 flex flex-col gap-3">
          <h2 className="text-xl font-semibold">누구신가요?</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">내 결과를 저장하고 다음에 나만의 비밀번호로 로그인하려면 크루원을 먼저 선택해 주세요. 한 번만 하면 돼요.</p>
          <div className="flex"><MemberCombobox options={members} selectedId={sel} onSelect={(id) => { setSel(id); setMsg(""); }} query={q} onQuery={setQ} label="크루원 선택" placeholder="내 이름 검색" /></div>
          {taken && (
            <div className="rounded-[10px] bg-secondary p-3.5 text-sm leading-relaxed" role="note">
              <b>{person!.name}</b>님은 이미 비밀번호를 등록했어요.
              <Button className="mt-2.5 w-full" onClick={loginInstead}>로그인 화면에서 이름으로 로그인하기</Button>
            </div>
          )}
          <div className="min-h-[22px] text-[13px] text-destructive" role="status">{msg}</div>
          <Button className="mt-2 h-12" disabled={!person || taken} onClick={() => { setMsg(""); setStep("pin"); }}>다음</Button>
        </section>
      )}

      {step === "pin" && (
        <section className="mt-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold">{person?.name}님의 비밀번호 등록</h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">다음 로그인부터 사용할<br />숫자 4자리를 입력해 주세요</p>
          <div className="mt-1 min-h-[22px] text-center text-[13px] text-destructive" role="status">{msg}</div>
          <PinKeypad onComplete={onPin} />
          <Button variant="ghost" className="mt-4" onClick={() => { setMsg(""); setStep("pick"); }}>크루원 다시 선택</Button>
        </section>
      )}

      {step === "confirm" && (
        <section className="mt-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold">한 번 더 입력해 주세요</h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">방금 등록한 비밀번호 4자리를<br />똑같이 입력해 주세요</p>
          <div className="mt-1 min-h-[22px]" />
          <PinKeypad onComplete={onConfirm} disabled={busy} />
          <Button variant="ghost" className="mt-4" disabled={busy} onClick={() => { setFirst(""); setMsg(""); setStep("pin"); }}>비밀번호 다시 등록</Button>
        </section>
      )}
    </main>
  );
}
