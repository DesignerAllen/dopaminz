import { requireViewer } from "@/lib/guard";
import { todayKst } from "@/lib/payment-rules";
import { loadActiveMembers, loadNotice } from "@/lib/status-data";
import { loadCatalog } from "@/lib/tickets";
import PageHeader from "@/components/PageHeader";
import TicketForm from "@/components/TicketForm";

// 크루권 신청서: 사용일 · 센터/지점 · 사용 구분 · 이용자(크루원/게스트, 여러 명) → 금액표와 입금 계좌 → 제출
export default async function NewTicketPage() {
  await requireViewer("/tickets/new", { adminTo: "/admin/tickets" });
  const [{ centers }, members, notice] = await Promise.all([loadCatalog(), loadActiveMembers(), loadNotice()]);
  return (
    <>
      <PageHeader title="크루권 신청서" admin={false} back="/tickets" />
      <TicketForm
        centers={centers}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        today={todayKst()}
        account={notice.notice_account}
      />
    </>
  );
}
