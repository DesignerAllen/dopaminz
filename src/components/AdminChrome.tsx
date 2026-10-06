"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** 관리자 모드 상단 바: 모드 표시 + [모드 종료] + [관리자 로그아웃]. 무활동 자동 종료는 없고, 세션(7일, 접속 시 갱신)이 살아 있는 동안 유지된다.
 *  모드 종료: 관리자 화면만 끄고 인증은 유지(다시 들어갈 때 비밀번호 없음) · 관리자 로그아웃: 인증까지 지움(다시 들어갈 때 비밀번호 필요) */
export default function AdminChrome() {
  const router = useRouter();

  async function exit(kind: "adminOnly" | "adminLogout") {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [kind]: true }) });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex h-(--h-adminbar) items-center gap-2.5 bg-[#1b2a41] pr-2 pl-4 text-[13px] font-semibold text-white">
      <span className="size-2 flex-none rounded-full bg-[#f5b73b]" aria-hidden="true" />
      <span className="min-w-0 flex-1">관리자 모드</span>
      <Button variant="link" onClick={() => exit("adminOnly")} className="h-full rounded-none px-2.5 text-[13px] font-normal text-[#c9d4e3] underline hover:text-white">
        모드 종료
      </Button>
      <Button variant="link" onClick={() => exit("adminLogout")} className="h-full rounded-none px-2.5 text-[13px] font-normal text-[#c9d4e3] underline hover:text-white">
        관리자 로그아웃
      </Button>
    </div>
  );
}
