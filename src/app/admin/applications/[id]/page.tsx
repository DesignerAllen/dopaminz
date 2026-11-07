import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/guard";
import { loadApplication } from "@/lib/application-data";
import { STATUS_STYLE } from "@/lib/applications";
import { formatDate } from "@/lib/notices";
import { Button } from "@/components/ui/button";
import { todayKst } from "@/lib/payment-rules";
import ApplicationActions from "@/components/ApplicationActions";
import PageHeader from "@/components/PageHeader";

// 관리자: 크루 가입 신청서 상세
export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const a = await loadApplication(Number(id));
  if (!a) notFound();

  const rows: [string, React.ReactNode][] = [
    ["상태", <span key="s" className={`inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[a.status]}`}>{a.status}</span>],
    ["이름", a.name],
    ["나이(생년)", `${a.birth_year}년생`],
    ["성별", a.gender],
    ["인스타그램 id", <a key="i" href={`https://www.instagram.com/${a.instagram_id}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">@{a.instagram_id}</a>],
    ["클라이밍 경력", a.experience],
    ["주 암장 및 거주지역", a.gym_area],
    ["볼더링 난이도", a.bouldering_level],
    ["가입 사유", <span key="r" className="whitespace-pre-wrap">{a.reason}</span>],
    ["신청일", formatDate(a.created_at)],
  ];

  return (
    <>
      <PageHeader title="신청서 상세" admin active="applications" back="/admin/applications" />
      <dl className="grid gap-4 px-4 pt-3 pb-6">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3">
            <dt className="text-[13px] text-muted-foreground">{k}</dt>
            <dd className="text-[15px] leading-relaxed break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <ApplicationActions id={a.id} status={a.status} name={a.name} instagram={a.instagram_id} today={todayKst()} />
      <div className="px-4 pb-8">
        <Button asChild variant="outline" className="w-full"><Link href="/admin/applications">목록으로</Link></Button>
      </div>
    </>
  );
}
