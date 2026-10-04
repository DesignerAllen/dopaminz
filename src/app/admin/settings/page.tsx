import { requireAdmin } from "@/lib/guard";
import { loadNotice, loadViewerPinDisplay } from "@/lib/status-data";
import PageHeader from "@/components/PageHeader";
import { loadCatalog, loadPasses, loadRequests } from "@/lib/tickets";
import { usedByPass } from "@/lib/ticket-passes";
import SettingsForms from "@/components/SettingsForms";

export const metadata = { title: "관리자 설정" };

// S-07 관리자 설정: 공지, 뷰어 비밀번호, 관리자 비밀번호
export default async function SettingsPage() {
  await requireAdmin();
  const [n, viewerPin, catalog, passes, { requests }] = await Promise.all([loadNotice(), loadViewerPinDisplay(), loadCatalog(true), loadPasses(), loadRequests()]);
  const usedMap = usedByPass(passes, requests);
  const passViews = passes.map((p) => ({ ...p, used: usedMap.get(p.id) ?? 0 }));
  return (
    <>
      <PageHeader title="관리자 설정" admin active="settings" />
      <SettingsForms fee={n.notice_fee} account={n.notice_account} due={n.notice_due} viewerPin={viewerPin} centers={catalog.centers} ticketsReady={catalog.ready} passes={passViews} />
    </>
  );
}
