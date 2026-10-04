"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** 로그인이 필요한 링크로 들어온 경우: 로그인 화면으로 보내고, 로그인 뒤 원래 주소로 돌아온다 */
export default function LoginRedirect({ next }: { next: string }) {
  const router = useRouter();
  const href = `/login?next=${encodeURIComponent(next)}`;
  useEffect(() => {
    router.replace(href);
  }, [router, href]);
  return (
    <main className="flex flex-1 flex-col items-center gap-2 px-7 pt-14">
      <h1 className="text-[22px] font-semibold">도파민즈 크루</h1>
      <p className="text-sm text-muted-foreground">회원 확인을 위해 로그인 화면으로 이동해요</p>
      <Button asChild className="mt-4"><a href={href}>비밀번호 입력하기</a></Button>
    </main>
  );
}
