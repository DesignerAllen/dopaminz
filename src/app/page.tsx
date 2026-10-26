import Link from "next/link";
import { ChevronRight, Dices, KeyRound, Settings2 } from "lucide-react";
import { requireViewer } from "@/lib/guard";
import { loadProfile } from "@/lib/climb-data";
import { findType } from "@/lib/climbmate";
import { loadMemberName } from "@/lib/member-auth";
import { loadActiveMembers } from "@/lib/status-data";
import LogoutButton from "@/components/LogoutButton";
import MenuCard from "@/components/MenuCard";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await requireViewer("/", { adminTo: "/admin" });
  // 개인 로그인(mid)이면 내 클메이트 결과 카드를 맨 위에 보여 준다. 공통 로그인은 기존 홈 그대로
  const [members, name, profile] = await Promise.all([
    loadActiveMembers(),
    session.mid ? loadMemberName(session.mid) : null,
    session.mid ? loadProfile(session.mid) : null,
  ]);
  const type = profile ? findType(profile.type_key) : null;

  return (
    <>
      <header className="sticky top-0 z-(--z-page-head) flex min-h-14 items-center justify-between gap-2 bg-background py-1.5 pr-3 pl-4">
        <h1 className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="도파민즈 크루" width={820} height={216} className="h-7 w-auto" />
        </h1>
        <div className="flex items-center">
          {session.mid && (
            <Button asChild variant="ghost" size="icon" aria-label="비밀번호 변경">
              <Link href="/account/password"><KeyRound className="size-5" strokeWidth={1.8} /></Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="icon" aria-label="관리자 모드">
            <Link href="/admin/login"><Settings2 className="size-5" strokeWidth={1.8} /></Link>
          </Button>
        </div>
      </header>
      <main className="flex flex-col gap-3 p-4">
        {!session.mid && <MenuCard href="/climbmate" title="내 클메이트 찾기" caption="성향 테스트로 크루에서 나와 잘 맞는 사람을 찾아보세요." />}
        {session.mid && (
          <Link
            href={type ? "/climbmate/me" : "/climbmate/test"}
            className="flex min-h-[96px] items-center gap-3 rounded-[10px] bg-neutral-900 px-4 py-4 text-left text-white transition-opacity active:opacity-90"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-white/60">{name ? `${name}님은` : "나는"}</span>
              {type ? (
                <>
                  <span className="mt-1 block text-xl font-bold">{type.alias}</span>
                  <span className="mt-0.5 block text-[13px] text-white/70">{type.catch}</span>
                </>
              ) : (
                <>
                  <span className="mt-1 block text-lg font-bold">내 유형을 알아볼까요?</span>
                  <span className="mt-0.5 block text-[13px] text-white/70">12문항, 약 2분이면 끝나요</span>
                </>
              )}
            </span>
            <ChevronRight className="size-5 shrink-0 text-white/80" aria-hidden="true" />
          </Link>
        )}
        <MenuCard href="/notices" title="공지사항" caption="크루 규정 및 공지사항을 확인하세요." />
        <MenuCard href="/members" title={`${members.length}명의 크루원이 있어요!`} caption="명단과 인스타그램 ID를 확인할 수 있어요." />
        <MenuCard href="/status" title="회비 납부 현황" caption="매달 회비 납부현황을 확인하세요." />
        <div className="flex flex-col gap-2">
          <MenuCard href="/tickets" title="크루권 신청" caption="서울숲, 손상원에서 사용할 수 있어요" />
          <Button asChild variant="outline" size="sm" className="self-center">
            <Link href="/gym-roulette"><Dices data-icon="inline-start" />암장 룰렛</Link>
          </Button>
        </div>
      </main>
      <footer className="mt-auto flex justify-center p-4">
        <LogoutButton />
      </footer>
    </>
  );
}
