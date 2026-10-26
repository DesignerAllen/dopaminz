import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCrewProfiles, loadProfile } from "@/lib/climb-data";
import { findType, namesByType } from "@/lib/climbmate";
import { loadMemberName } from "@/lib/member-auth";
import PageHeader from "@/components/PageHeader";
import ClimbResult from "@/components/ClimbResult";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };

/** 주소의 크루원 번호로 저장된 결과를 찾는다(저장 전이거나 없는 번호면 null) */
async function load(idParam: string) {
  // 앞쪽 숫자만 번호로 쓴다: 메신저가 공유 문구까지 주소로 붙여 보낸 옛 링크("17 채정훈님은…")도 열리게 한다
  const id = Number(/^\d+/.exec(decodeURIComponent(idParam))?.[0]);
  if (!Number.isInteger(id) || id <= 0) return null;
  const [profile, name] = await Promise.all([loadProfile(id), loadMemberName(id)]);
  return profile && name ? { profile, name } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await load((await params).id);
  const type = r && findType(r.profile.type_key);
  if (!r || !type) return { title: "내 클메이트 찾기" };
  const title = `${r.name}님은 ${type.alias}`;
  return { title, description: type.catch, openGraph: { title, description: type.catch }, twitter: { card: "summary", title, description: type.catch } };
}

// 공유용 결과 페이지(읽기 전용, 로그인 불필요). 주소는 /climbmate/result/<크루원 번호>
export default async function SharedClimbResultPage({ params, searchParams }: Props) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const r = await load(id);
  if (!r) notFound();
  const crew = await loadCrewProfiles();
  return (
    <>
      <PageHeader title="클메이트 결과" admin={false} back={from === "members" ? "/members" : "/"} />
      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-7">
        <ClimbResult axes={r.profile.axes} owner={r.name} crewNames={namesByType(crew, r.profile.member_id)} />
        <Button asChild className="h-12 text-base"><Link href="/climbmate">나도 해보기</Link></Button>
      </main>
    </>
  );
}
