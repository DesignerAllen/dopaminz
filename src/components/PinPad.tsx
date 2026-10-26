"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete } from "lucide-react";
import MemberCombobox from "@/components/MemberCombobox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoginMember = { id: number; name: string; hasPin: boolean };

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/** 공통 로그인 + 크루원 검색: 이름을 고르지 않으면 공용 비밀번호, 이름을 고르면 그 크루원의 개인 비밀번호로 로그인한다 */
export default function PinPad({ next = "/", members = [] }: { next?: string; members?: LoginMember[] }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const person = members.find((m) => m.id === sel) ?? null;
  const noPin = !!person && !person.hasPin; // 아직 개인 비밀번호를 등록하지 않은 크루원

  function choose(id: number | null) {
    setSel(id);
    setPin("");
    setMsg("");
    setFailed(false);
  }

  async function submit(value: string) {
    setBusy(true);
    try {
      const res = await fetch(person ? "/api/auth/member" : "/api/auth/viewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(person ? { memberId: person.id, pin: value } : { pin: value }),
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
    if (locked || busy || noPin) return;
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
      <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
        {person ? (noPin ? <>{person.name}님은 아직 개인 비밀번호가 없어요</> : <>{person.name}님의 개인 비밀번호<br />4자리를 입력해주세요</>) : <>도파민즈 크루 전용 서비스입니다<br />공통 비밀번호 4자리를 입력해주세요</>}
      </p>
      {members.length > 0 && (
        <div className="mt-5 flex w-full">
          <MemberCombobox options={members} selectedId={sel} onSelect={choose} query={q} onQuery={setQ} label="크루원 검색" placeholder="내 이름 검색 (선택 시 개인 로그인)" />
        </div>
      )}
      <div className="mt-6 mb-2 flex gap-4" role="img" aria-label={`${pin.length}자리 입력됨`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("size-4 rounded-full border-2 border-primary", i < pin.length && "bg-primary")} />
        ))}
      </div>
      <div className="min-h-[22px] text-center text-[13px] font-normal text-destructive" role="status">
        {noPin ? <span className="text-muted-foreground">공통 비밀번호로 로그인한 뒤 ‘클메이트 찾기’에서 등록할 수 있어요</span> : msg}
      </div>
      <div className="mt-2 grid w-full grid-cols-3 gap-2">
        {KEYS.map((k, i) =>
          k === "" ? (
            <div key={i} aria-hidden="true" />
          ) : (
            <Button
              key={i}
              variant="ghost"
              disabled={locked || busy || noPin}
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
          {person ? "개인 비밀번호를 잊었다면 운영진에게 초기화를 요청해 주세요" : "비밀번호를 모를 경우 운영진에게 문의주세요"}
        </p>
      )}
    </main>
  );
}
