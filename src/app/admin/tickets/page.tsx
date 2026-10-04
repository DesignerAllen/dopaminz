import { requireAdmin } from "@/lib/guard";
import { loadCatalog, loadPasses, loadRequests } from "@/lib/tickets";
import { remainingByCenter } from "@/lib/ticket-passes";
import { todayKst } from "@/lib/payment-rules";
import TicketIntro from "@/components/TicketIntro";
import { loadNotice } from "@/lib/status-data";
import PageHeader from "@/components/PageHeader";
import AdminTicketList from "@/components/AdminTicketList";


// 관리자: 크루권 신청 목록과 입금 여부 체크(센터·지점·금액 설정은 설정 > 크루권)
export default async function AdminTicketsPage() {
  await requireAdmin();
  const [{ requests, ready }, { centers }, passes, notice] = await Promise.all([loadRequests(), loadCatalog(), loadPasses(), loadNotice()]);
  const left = remainingByCenter(passes, requests, todayKst());
  const intro = centers.map((c) => ({ id: c.id, name: c.name, branches: c.branches.map((b) => b.name), code: c.entry_code, remaining: left.get(c.id) ?? null }));
  return (
    <>
      <PageHeader title="크루권 관리" admin active="tickets" />
      <TicketIntro centers={intro} account={notice.notice_account} />
      <AdminTicketList requests={requests} ready={ready} centers={centers.map((c) => c.name)} />
    </>
  );
}
