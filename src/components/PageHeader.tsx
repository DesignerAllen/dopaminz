import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AdminChrome from "./AdminChrome";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// 관리자 모드는 크루원 화면과 분리된 영역이다: 탭으로 관리 메뉴만 오가고, 일반 화면으로 가는 뒤로가기는 없다.
// 크루권 등록 등 관리 메뉴가 늘어나면 여기에 탭을 추가한다.
const ADMIN_TABS = [
  { href: "/admin/payments", label: "회비", key: "payments" },
  { href: "/admin/members", label: "회원", key: "members" },
  { href: "/admin/notices", label: "공지", key: "notices" },
  { href: "/admin/tickets", label: "크루권", key: "tickets" },
  { href: "/admin/settings", label: "설정", key: "settings" },
] as const;

export type AdminTabKey = (typeof ADMIN_TABS)[number]["key"];

/** 크루원 화면: 제목줄 + 뒤로가기(back).
 *  관리자 화면(admin): 관리자 바 + 제목줄 + 관리 탭. 뒤로가기는 하위 화면(back 지정)에서만 같은 관리 영역 안으로 돌아가는 용도로 나온다.
 *  전체가 스크롤해도 고정(sticky)이며 겹침 순서는 --z-page-head 를 따른다. */
export default function PageHeader({ title, admin, active = null, back }: { title: string; admin: boolean; active?: AdminTabKey | null; back?: string }) {
  const backHref = admin ? back : (back ?? "/");
  return (
    <div className="sticky top-0 z-(--z-page-head) bg-background">
      {admin && <AdminChrome />}
      <header className={cn("flex h-(--h-subbar) items-center gap-1 pr-4", backHref ? "pl-1" : "pl-4")}>
        {backHref && (
          <Button asChild variant="ghost" size="icon" aria-label="뒤로">
            <Link href={backHref}><ChevronLeft className="size-6" /></Link>
          </Button>
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>
      {admin && (
        <Tabs value={active ?? ""} className="px-4">
          <TabsList variant="line" aria-label="관리 메뉴" className="h-(--h-tabs) w-full rounded-none border-b p-0 group-data-horizontal/tabs:h-(--h-tabs)">
            {ADMIN_TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} asChild className="h-full text-[15px] font-normal data-active:font-semibold data-active:text-primary after:bottom-0! after:bg-primary">
                <Link href={t.href} aria-current={t.key === active ? "page" : undefined}>{t.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}
