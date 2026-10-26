import Link from "next/link";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/guard";
import { loadProfile } from "@/lib/climb-data";
import { AXES } from "@/lib/climbmate";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export const metadata = { title: "내 클메이트 찾기" };

export default async function ClimbmatePage() {
  const s = await requireViewer("/climbmate", { adminTo: "/admin" });
  // 소개 화면은 최초(개인 로그인 전)에만 보인다. 이후에는 내 결과(또는 테스트)로 바로 간다
  if (s.mid) redirect((await loadProfile(s.mid)) ? "/climbmate/me" : "/climbmate/test");

  return (
    <>
      <PageHeader title="내 클메이트 찾기" admin={false} back="/" />
      <main className="flex flex-1 flex-col gap-5 px-5 pt-4 pb-7">
        <section>
          <h2 className="text-[26px] leading-tight font-bold">나는 어떤<br />클라이머일까?</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">12문항으로 나의 클라이밍 성향을 알아보고, 크루 안에서 나와 잘 맞는 클메이트를 찾아보세요. 약 2분이면 끝나요.</p>
        </section>

        <ul className="grid grid-cols-2 gap-2" aria-label="성향 4가지 축">
          {AXES.map((a) => (
            <li key={a.name} className="rounded-[10px] border bg-card p-3">
              <div className="text-xs text-muted-foreground">{a.name}</div>
              <div className="mt-1 text-sm font-semibold">{a.left} <span className="font-normal text-muted-foreground">vs</span> {a.right}</div>
            </li>
          ))}
        </ul>
        <p className="text-center text-[13px] text-muted-foreground">4가지 성향이 모여 16가지 유형 중 하나로 진단돼요</p>

        <div className="mt-auto flex flex-col gap-2.5">
          <Button asChild className="h-12 text-base"><Link href="/climbmate/start">시작하기</Link></Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">내 결과를 저장하려면 처음 한 번 크루원을 선택하고<br />개인 비밀번호를 등록해요. 다음부터는 로그인 화면에서 이름을 검색해 로그인해요.</p>
        </div>
      </main>
    </>
  );
}
