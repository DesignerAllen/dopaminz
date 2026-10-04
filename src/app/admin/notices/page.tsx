import { requireAdmin } from "@/lib/guard";
import { formatDate, loadNotices } from "@/lib/notices";
import PageHeader from "@/components/PageHeader";
import NoticeManager from "@/components/NoticeManager";

export const metadata = { title: "공지 관리" };

// 관리자: 공지사항 작성·수정
export default async function AdminNoticesPage() {
  await requireAdmin();
  const { notices, ready } = await loadNotices(true);
  return (
    <>
      <PageHeader title="공지 관리" admin active="notices" />
      <NoticeManager
        ready={ready}
        notices={notices.map((n) => ({ id: n.id, title: n.title, content: n.content, created: formatDate(n.created_at), updated: n.updated_at ? formatDate(n.updated_at) : null, status: n.status, pinned: n.pinned }))}
      />
    </>
  );
}
