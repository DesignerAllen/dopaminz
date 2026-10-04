import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/guard";
import { isUuid, loadNotice } from "@/lib/notices";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import NoticeArticle from "@/components/NoticeArticle";

// 관리자: 공지 미리보기(미노출 공지 포함). 크루원 화면으로 나가지 않고 관리 영역 안에서 본다.
export default async function AdminNoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const n = await loadNotice(id);
  if (!n) notFound();
  return (
    <>
      <PageHeader title="공지 미리보기" admin active="notices" back="/admin/notices" />
      <NoticeArticle n={n} showShare />
      <div className="px-4 pb-8">
        <Button asChild variant="outline" className="w-full"><Link href="/admin/notices">목록으로</Link></Button>
      </div>
    </>
  );
}
