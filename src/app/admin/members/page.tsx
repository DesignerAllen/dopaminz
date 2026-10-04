import { requireAdmin } from "@/lib/guard";
import { SERVICE_START, todayKst } from "@/lib/payment-rules";
import { loadActivePaymentsAll, loadAllMembers } from "@/lib/status-data";
import PageHeader from "@/components/PageHeader";
import MemberManager from "@/components/MemberManager";

// S-06 관리자 모드: 회원 등록·수정, 상태 관리, 미노출 회원(사유별)
export default async function AdminPage() {
  await requireAdmin();
  const [all, pays] = await Promise.all([loadAllMembers(), loadActivePaymentsAll()]);
  const active = all.filter((m) => m.status === "회원");
  const hidden = all.filter((m) => m.status === "미노출");

  // 가입일 이전 달에 납부 기록이 있으면 경고 (가입일 수정 후 발생 가능)
  const byId = new Map(active.map((m) => [m.id, m]));
  const warnings = pays
    .filter((p) => byId.has(p.member_id) && p.year_month >= SERVICE_START && p.year_month < byId.get(p.member_id)!.joined_at.slice(0, 7))
    .map((p) => `${byId.get(p.member_id)!.name} — ${p.year_month} (가입 ${byId.get(p.member_id)!.joined_at})`);

  const strip = (m: (typeof all)[number]) => ({ id: m.id, name: m.name, joined_at: m.joined_at, instagram_id: m.instagram_id, hidden_reason: m.hidden_reason, hidden_at: m.hidden_at });
  return (
    <>
      <PageHeader title="회원 관리" admin active="members" />
      <MemberManager active={active.map(strip)} hidden={hidden.map(strip)} warnings={warnings} today={todayKst()} />
    </>
  );
}
