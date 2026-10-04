import Link from "next/link";
import { Settings2 } from "lucide-react";
import { requireViewer } from "@/lib/guard";
import { loadActiveMembers } from "@/lib/status-data";
import LogoutButton from "@/components/LogoutButton";
import MenuCard from "@/components/MenuCard";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  await requireViewer("/", { adminTo: "/admin" });
  const members = await loadActiveMembers();

  return (
    <>
      <header className="sticky top-0 z-(--z-page-head) flex min-h-14 items-center justify-between gap-2 bg-background py-1.5 pr-3 pl-4">
        <h1 className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="도파민즈 크루" width={820} height={216} className="h-7 w-auto" />
        </h1>
        <Button asChild variant="ghost" size="icon" aria-label="관리자 모드">
          <Link href="/admin/login"><Settings2 className="size-5" strokeWidth={1.8} /></Link>
        </Button>
      </header>
      <main className="flex flex-col gap-3 p-4">
        <MenuCard href="/notices" title="공지사항" caption="크루 규정 및 공지사항을 확인하세요." />
        <MenuCard href="/members" title={`${members.length}명의 크루원이 있어요!`} caption="명단과 인스타그램 ID를 확인할 수 있어요." />
        <MenuCard href="/status" title="회비 납부 현황" caption="매달 회비 납부현황을 확인하세요." />
        <MenuCard href="/tickets" title="크루권 신청" caption="서울숲, 손상원에서 사용할 수 있어요" />
      </main>
      <footer className="mt-auto flex justify-center p-4">
        <LogoutButton />
      </footer>
    </>
  );
}
