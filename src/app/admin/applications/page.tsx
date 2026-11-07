import { requireAdmin } from "@/lib/guard";
import { loadApplications } from "@/lib/application-data";
import { formatDate } from "@/lib/notices";
import PageHeader from "@/components/PageHeader";
import ApplicationList from "@/components/ApplicationList";

// 관리자: 크루 가입 신청서 목록
export default async function AdminApplicationsPage() {
  await requireAdmin();
  const { applications, ready } = await loadApplications();
  return (
    <>
      <PageHeader title="신청서" admin active="applications" />
      <ApplicationList ready={ready} items={applications.map((a) => ({ id: a.id, name: a.name, instagram: a.instagram_id, date: formatDate(a.created_at), status: a.status }))} />
    </>
  );
}
