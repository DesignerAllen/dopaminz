import { requireViewer } from "@/lib/guard";
import { loadActiveMembers } from "@/lib/status-data";
import PageHeader from "@/components/PageHeader";
import { todayKst } from "@/lib/payment-rules";
import MemberList from "@/components/MemberList";

// S-04 크루원 목록 (상태가 '회원'인 사람만)
export default async function MembersPage() {
  await requireViewer("/members", { adminTo: "/admin/members" });
  const admin = false;
  const members = await loadActiveMembers();
  return (
    <>
      <PageHeader title="크루원 목록" admin={admin} active={null} />
      <MemberList members={members} today={todayKst()} />
    </>
  );
}
