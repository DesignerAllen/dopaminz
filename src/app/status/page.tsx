import { requireViewer } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import StatusBody from "@/components/StatusBody";

// 크루원: 월별 회비 납부 현황(읽기 전용). 관리자 모드에서는 /admin/payments 로 보낸다.
export default async function StatusPage() {
  await requireViewer("/status", { adminTo: "/admin/payments" });
  return (
    <>
      <PageHeader title="회비 납부 현황" admin={false} back="/" />
      <StatusBody admin={false} personBase="/status/person" showNotice />
    </>
  );
}
