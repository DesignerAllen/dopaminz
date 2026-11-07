import { Pin } from "lucide-react";
import { requireViewer } from "@/lib/guard";
import { formatDate, loadNotices, noticeKey } from "@/lib/notices";
import PageHeader from "@/components/PageHeader";
import { ListRow } from "@/components/tds";

export const metadata = { title: "공지사항" };

// 공지사항 목록 (고정 공지 먼저, 그다음 최신순)
export default async function NoticesPage() {
  await requireViewer("/notices", { adminTo: "/admin/notices" });
  const { notices, ready } = await loadNotices();

  return (
    <>
      <PageHeader title="공지사항" admin={false} />
      <ul className="pt-1 pb-6">
        {notices.map((n) => (
          <li key={n.id} className="relative after:absolute after:right-0 after:bottom-0 after:left-6 after:h-px after:bg-[#f2f4f6] last:after:hidden">
            <ListRow
              href={`/notices/${noticeKey(n)}`}
              withArrow
              verticalPadding="large"
              contents={
                <>
                  <span className="block text-[13px] leading-[19.5px] text-[#6b7684]">{formatDate(n.created_at)}</span>
                  <span className="flex items-center gap-1.5 text-[17px] leading-[25.5px] font-semibold text-[#191f28]">
                    {n.pinned && <Pin className="size-4 flex-none text-[#6b7684]" aria-label="상단 고정" />}
                    <span className="min-w-0 truncate">{n.title}</span>
                  </span>
                </>
              }
            />
          </li>
        ))}
        {notices.length === 0 && <li className="p-8 text-center text-[15px] text-[#6b7684]">{ready ? "등록된 공지사항이 없어요" : "공지사항을 준비하고 있어요"}</li>}
      </ul>
    </>
  );
}
