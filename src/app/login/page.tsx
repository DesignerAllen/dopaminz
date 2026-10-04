import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { currentVersion } from "@/lib/guard";
import PinPad from "@/components/PinPad";

export const metadata = { title: "비밀번호 입력" };

/** 로그인 후 돌아갈 내부 경로만 허용한다(열린 리다이렉트 방지) */
function safeNext(n: string | undefined): string {
  return n && /^\/(?!\/)[\w\-\/.%]*$/.test(n) ? n : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  // 유효한 세션이면 원래 가려던 곳으로. 비밀번호 변경으로 버전이 어긋난 옛 세션은 여기서도 무효로 봐야 /login ↔ 페이지 무한 이동이 생기지 않는다
  const s = await readSession();
  if (s && (await currentVersion()) === s.ver) redirect(next);
  return <PinPad next={next} />;
}
