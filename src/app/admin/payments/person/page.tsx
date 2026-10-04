import { requireAdmin } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import PersonBody from "@/components/PersonBody";

export const metadata = { title: "개인별 회비 관리" };

// 관리자: 인원별 납부 체크
export default async function AdminPersonPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requireAdmin();
  const { m } = await searchParams;
  return (
    <>
      <PageHeader title="인원별 회비" admin active="payments" back="/admin/payments" />
      <PersonBody admin m={m} basePath="/admin/payments/person" />
    </>
  );
}
