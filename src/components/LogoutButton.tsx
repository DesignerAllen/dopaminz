"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AssetText, press, pressRow } from "./tds";
import { cn } from "@/lib/utils";

function useLogout() {
  const router = useRouter();
  return async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    router.replace("/login");
    router.refresh();
  };
}

/** 홈(공통 로그인) 상단: 누르면 바로 로그아웃되는 아이콘 버튼 */
export function LogoutIconButton() {
  const logout = useLogout();
  return (
    <button type="button" onClick={logout} aria-label="로그아웃" className={cn("flex size-10 flex-none items-center justify-center rounded-full text-[#6b7684] active:bg-[#f2f4f6]", press)}>
      <LogOut className="size-[22px]" strokeWidth={1.8} />
    </button>
  );
}

/** 설정 화면 목록 행 형태의 로그아웃 */
export default function LogoutButton() {
  const logout = useLogout();
  return (
    <button type="button" onClick={logout} className={cn("flex w-full items-center gap-4 px-6 py-3 text-left", pressRow)}>
      <AssetText>👋</AssetText>
      <span className="min-w-0 flex-1 text-[17px] leading-[25.5px] font-semibold text-[#191f28]">로그아웃</span>
    </button>
  );
}
