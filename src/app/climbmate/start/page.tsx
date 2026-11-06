import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/guard";
import { loadLoginMembers } from "@/lib/member-auth";
import PageHeader from "@/components/PageHeader";
import ClimbSetup from "@/components/ClimbSetup";

export const metadata = { title: "클메이트 시작하기" };

// 최초 1회: 크루원 선택 + 개인 비밀번호 등록. 이미 개인 로그인한 상태면 소개 화면으로
export default async function ClimbStartPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const n = (await searchParams).next;
  const next = n === "/" ? "/" : "/climbmate/test"; // 홈에서 온 경우만 홈으로 돌려보낸다(그 외는 열린 리다이렉트 방지를 위해 고정)
  const s = await requireViewer(n === "/" ? "/climbmate/start?next=/" : "/climbmate/start", { adminTo: "/admin" });
  if (s.mid) redirect("/climbmate");
  return (
    <>
      <PageHeader title="시작하기" admin={false} back={next === "/" ? "/" : "/climbmate"} />
      <ClimbSetup members={await loadLoginMembers()} next={next} />
    </>
  );
}
