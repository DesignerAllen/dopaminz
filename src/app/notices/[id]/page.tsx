import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentVersion } from "@/lib/guard";
import { readSession, isAdmin } from "@/lib/session";
import { excerpt, isNoticeKey, loadNotice, noticeKey } from "@/lib/notices";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import NoticeArticle from "@/components/NoticeArticle";
import LoginRedirect from "@/components/LoginRedirect";

type Props = { params: Promise<{ id: string }> };

// 공유 링크 미리보기용 메타 태그(제목, 내용 일부). 로그인 전에도 크롤러가 읽을 수 있다.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await loadNotice((await params).id);
  // 미노출 공지는 제목·내용을 메타 태그로도 내보내지 않는다
  if (!n || n.status !== "노출") return { title: "공지사항" };
  const title = n.title;
  const description = excerpt(n.content, 100);
  return {
    title,
    description,
    openGraph: { type: "article", siteName: "도파민즈 크루", locale: "ko_KR", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "도파민즈 크루" }], publishedTime: n.created_at, modifiedTime: n.updated_at ?? undefined, url: `/notices/${noticeKey(n)}` },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
    alternates: { canonical: `/notices/${noticeKey(n)}` },
  };
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id } = await params;
  if (!isNoticeKey(id)) notFound();
  const path = `/notices/${id}`;

  // 미리보기 크롤러를 위해 서버 리다이렉트 대신 화면에서 로그인으로 보낸다(메타 태그는 위에서 이미 만들어짐)
  const session = await readSession();
  if (!session || (await currentVersion()) !== session.ver) return <LoginRedirect next={path} />;
  // 관리자 모드에서는 크루원 화면을 보지 않고 관리자 영역의 같은 공지로 보낸다
  if (isAdmin(session)) redirect(`/admin/notices/${id}`);

  // 미노출 공지는 없는 공지와 같다
  const n = await loadNotice(id);
  if (!n || n.status === "미노출") notFound();

  return (
    <>
      <PageHeader title="공지사항" admin={false} back="/notices" />
      <NoticeArticle n={n} />
      <div className="px-4 pb-8">
        <Button asChild variant="outline" className="w-full"><Link href="/notices">목록으로</Link></Button>
      </div>
    </>
  );
}
