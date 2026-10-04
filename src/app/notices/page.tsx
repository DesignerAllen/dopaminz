import Link from "next/link";
import { ChevronRight, Pin } from "lucide-react";
import { requireViewer } from "@/lib/guard";
import { excerpt, formatDate, loadNotices, noticeKey } from "@/lib/notices";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "공지사항" };

// 공지사항 목록 (고정 공지 먼저, 그다음 최신순)
export default async function NoticesPage() {
  await requireViewer("/notices", { adminTo: "/admin/notices" });
  const { notices, ready } = await loadNotices();

  return (
    <>
      <PageHeader title="공지사항" admin={false} />
      <ul className="mx-4 mt-4 divide-y overflow-hidden rounded-[10px] border bg-card">
        {notices.map((n) => (
          <li key={n.id}>
            <Link href={`/notices/${noticeKey(n)}`} className="flex min-h-[72px] items-center gap-2.5 px-4 py-3.5 active:bg-secondary">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[15px] font-semibold">
                  {n.pinned && <Pin className="size-3.5 flex-none text-primary" aria-label="상단 고정" />}
                  <span className="min-w-0 truncate">{n.title}</span>
                </div>
                <div className="mt-0.5 truncate text-[13px] text-foreground/75">{excerpt(n.content, 60)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</div>
              </div>
              <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
        {notices.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">{ready ? "등록된 공지사항이 없어요" : "공지사항을 준비하고 있어요"}</li>}
      </ul>
    </>
  );
}
