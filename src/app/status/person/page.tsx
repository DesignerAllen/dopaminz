import { requireViewer } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import PersonBody from "@/components/PersonBody";

export const metadata = { title: "개인별 납부 현황" };

// 크루원: 인원별 납부 현황(읽기 전용)
export default async function PersonPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requireViewer("/status/person", { adminTo: "/admin/payments/person" });
  const { m } = await searchParams;
  return (
    <>
      <PageHeader title="인원별 납부 현황" admin={false} back="/status" />
      <PersonBody admin={false} m={m} basePath="/status/person" />
    </>
  );
}
