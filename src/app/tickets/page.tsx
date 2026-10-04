import Link from "next/link";
import { Plus } from "lucide-react";
import { requireViewer } from "@/lib/guard";
import { loadCatalog, loadPasses, loadRequests } from "@/lib/tickets";
import { remainingByCenter } from "@/lib/ticket-passes";
import { todayKst } from "@/lib/payment-rules";
import { loadNotice } from "@/lib/status-data";
import PageHeader from "@/components/PageHeader";
import TicketIntro from "@/components/TicketIntro";
import TicketList from "@/components/TicketList";
import { Button } from "@/components/ui/button";

// 크루권 신청 내역(최신순)과 납부/미납, 금액. 여기서 신청 화면으로 이동한다.
export default async function TicketsPage() {
  await requireViewer("/tickets", { adminTo: "/admin/tickets" });
  const [{ requests, ready }, { centers }, passes, notice] = await Promise.all([loadRequests(), loadCatalog(), loadPasses(), loadNotice()]);
  const left = remainingByCenter(passes, requests, todayKst());
  const intro = centers.map((c) => ({ id: c.id, name: c.name, branches: c.branches.map((b) => b.name), code: c.entry_code, remaining: left.get(c.id) ?? null }));
  return (
    <>
      <PageHeader title="크루권 신청" admin={false} />
      <TicketIntro centers={intro} account={notice.notice_account} />
      <div className="px-4 pt-4">
        <Button asChild size="lg" className="w-full">
          <Link href="/tickets/new"><Plus /> 크루권 신청하기</Link>
        </Button>
      </div>
      <TicketList requests={requests} ready={ready} centers={centers.map((c) => c.name)} />
    </>
  );
}
