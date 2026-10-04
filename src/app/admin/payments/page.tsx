import { requireAdmin } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import StatusBody from "@/components/StatusBody";

export const metadata = { title: "회비 관리" };

// 관리자: 월별 회비 납부 체크
export default async function AdminPaymentsPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="회비 관리" admin active="payments" />
      <StatusBody admin personBase="/admin/payments/person" showNotice={false} />
    </>
  );
}
