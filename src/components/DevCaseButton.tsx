"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { DEV_CASE_COOKIE, type DevCase } from "@/lib/dev-case-shared";

const FEE = [["", "실제 데이터"], ["unpaid1", "미납 1개월"], ["unpaid3", "미납 3개월"], ["paid", "미납 없음"]] as const;
const TICKET = [["", "실제 데이터"], ["d3", "크루권 D-3"], ["d0", "크루권 당일"], ["none", "크루권 없음/D+1"]] as const;

const LOGIN = [["", "개인 로그인(실제)"], ["common", "공통 로그인(개인 X)"]] as const;
const CLIMB = [["", "실제 데이터"], ["done", "클메이트 등록"], ["none", "클메이트 미등록"]] as const;

function read(): DevCase {
  try {
    const m = document.cookie.split("; ").find((c) => c.startsWith(`${DEV_CASE_COOKIE}=`));
    return m ? (JSON.parse(decodeURIComponent(m.split("=")[1])) as DevCase) : {};
  } catch {
    return {};
  }
}

/** 로컬 개발 전용: 우측 하단 [케이스] 버튼. 홈 화면의 회비·크루권 표시를 케이스별로 바꿔 본다(DB 변경 없음). layout 에서 development 일 때만 렌더링한다 */
export default function DevCaseButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState<DevCase>({});

  function set(key: keyof DevCase, v: string) {
    const next = { ...read(), [key]: v || undefined };
    document.cookie = `${DEV_CASE_COOKIE}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=31536000`;
    setCur(next);
    router.refresh();
  }

  const group = (title: string, key: keyof DevCase, opts: readonly (readonly [string, string])[]) => (
    <div className="mb-2">
      <div className="mb-1 text-[11px] text-white/60">{title}</div>
      <div className="flex flex-wrap gap-1">
        {opts.map(([v, l]) => (
          <button key={v} onClick={() => set(key, v)} className={`rounded px-2 py-1 text-xs ${(cur[key] ?? "") === v ? "bg-white text-black" : "bg-white/15 text-white"}`}>{l}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed right-3 bottom-3 z-[9999] flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 rounded-lg bg-neutral-900/95 p-3 text-white shadow-lg">
          {group("로그인 케이스", "login", LOGIN)}
          {group("회비 케이스", "fee", FEE)}
          {group("클메이트 케이스", "climb", CLIMB)}
          {group("크루권 케이스", "ticket", TICKET)}
          <p className="text-[10px] text-white/50">로컬 전용 · DB에 반영되지 않아요</p>
        </div>
      )}
      <button onClick={() => { setCur(read()); setOpen((o) => !o); }} className="flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-2 text-xs font-semibold text-white shadow-lg">
        <FlaskConical className="size-4" /> 케이스
      </button>
    </div>
  );
}
