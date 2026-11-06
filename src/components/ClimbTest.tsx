"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUESTIONS } from "@/lib/climbmate";
import { cn } from "@/lib/utils";

/** 12문항 A/B 선택. 고르면 다음 문항으로 넘어가고, 이전 문항으로 돌아가 바꿀 수 있다. 마지막 문항 뒤에 결과를 저장한다 */
export default function ClimbTest() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(0 | 1)[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const q = QUESTIONS[i];

  async function save(all: (0 | 1)[]) {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/climbmate/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: all }),
      });
      if (res.status === 401) return router.replace("/climbmate/start");
      if (!res.ok) throw new Error("save");
      router.replace("/climbmate/me"); // 이동하는 동안 저장 중 화면을 유지한다
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error && e.message === "save" ? "결과를 저장하지 못했어요. 다시 시도해 주세요" : "네트워크 오류가 발생했어요. 다시 시도해 주세요");
      setSaving(false);
    }
  }

  function choose(side: 0 | 1) {
    const all = [...answers.slice(0, i), side, ...answers.slice(i + 1)];
    setAnswers(all);
    if (i + 1 < QUESTIONS.length) setI(i + 1);
    else void save(all);
  }

  if (answers.length === QUESTIONS.length && (saving || err)) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold">{err ? "저장에 실패했어요" : "나의 유형을 찾는 중…"}</p>
        {err && <p className="text-sm text-destructive" role="status">{err}</p>}
        {err && <Button onClick={() => save(answers)}>다시 저장하기</Button>}
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-7">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[13px] text-muted-foreground">
          <Button variant="ghost" size="sm" className="-ml-2" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft data-icon="inline-start" />이전 문항</Button>
          <span aria-live="polite">{i + 1} / {QUESTIONS.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={i + 1}>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((i + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
      </div>
      <h2 className="mt-4 min-h-[84px] text-[22px] leading-snug font-semibold">Q{i + 1}. {q.q}</h2>
      <div className="flex flex-col gap-3">
        {[q.a, q.b].map(([text, side], n) => (
          <button
            key={n}
            type="button"
            onClick={() => choose(side)}
            className={cn(
              "min-h-20 rounded-[12px] border bg-card px-4 py-4 text-left text-base leading-snug transition-colors active:bg-secondary",
              answers[i] === side && "border-primary ring-2 ring-primary/30",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </main>
  );
}
