import { SERVICE_START, kindForAdmin, kindOf, miToYm, todayKst, ymToMi } from "@/lib/payment-rules";
import { CircleCheck } from "lucide-react";
import { loadActiveMembers, loadMemberPayments } from "@/lib/status-data";
import MemberSelect from "./MemberSelect";
import { Card, CardContent } from "@/components/ui/card";
import { ExceptionToggle, PayCell, PayEditorProvider } from "./PayEditor";

/** 인원별 납부 현황. m: 선택한 회원 id(없으면 첫 번째), basePath: 회원을 바꿀 때 이동할 주소 */
export default async function PersonBody({ admin, m, basePath }: { admin: boolean; m?: string; basePath: string }) {
  const sp = { m };
  const members = await loadActiveMembers();
  if (members.length === 0) {
    return (
      <div className="m-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">등록된 회원이 없어요</div>
    );
  }
  const member = members.find((m) => String(m.id) === sp.m) ?? members[0];
  const payments = await loadMemberPayments(member.id);
  const paid = new Map(payments.map((p) => [p.year_month, p]));

  const curYm = todayKst().slice(0, 7);
  const curMi = ymToMi(curYm);
  const kind = admin ? kindForAdmin : kindOf;

  // 표시할 달: 가입 이후(서비스 시작 월 이후)부터 이번 달+2개월까지, 더 먼 선납 기록이 있으면 그 달까지. 최신 달이 위.
  const joinYm = member.joined_at.slice(0, 7);
  const paidMonths = payments.map((p) => p.year_month).filter((ym) => ym >= SERVICE_START);
  const firstYm = [joinYm > SERVICE_START ? joinYm : SERVICE_START, ...paidMonths].reduce((a, b) => (a < b ? a : b));
  const lastMi = Math.max(curMi + 2, ...paidMonths.map(ymToMi));
  const rows: string[] = [];
  for (let mi = lastMi; mi >= ymToMi(firstYm); mi--) rows.push(miToYm(mi));

  // 요약: 서비스 시작(또는 가입) 이후 현재 달까지의 납부·미납 개월 수
  let paidN = 0, unpaidN = 0;
  for (let mi = ymToMi(joinYm > SERVICE_START ? joinYm : SERVICE_START); mi <= curMi; mi++) {
    const k = kindOf(member.joined_at, miToYm(mi), paid.get(miToYm(mi)), curYm);
    if (k === "paid" || k === "exception") paidN++;
    else if (k === "unpaid") unpaidN++;
  }

  return (
    <PayEditorProvider editable={admin}>
      <MemberSelect members={members.map((m) => ({ id: m.id, name: m.name }))} value={member.id} basePath={basePath} />

      <Card className="mx-4 mt-3 gap-0 rounded-[10px] py-4">
        <CardContent className="px-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-lg font-semibold">{member.name}</div>
            {member.instagram_id && (
              <a className="text-[13px] font-normal text-primary" href={`https://instagram.com/${member.instagram_id}`} target="_blank" rel="noopener noreferrer">@{member.instagram_id}</a>
            )}
          </div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">가입일 {member.joined_at}</div>
          <div className="mt-3 flex gap-2.5">
            <div className="flex-1 rounded-[10px] bg-[#ddf0e6] p-2.5 text-center text-[#0b5a44]"><div className="text-xs font-semibold">납부</div><b className="text-xl">{paidN}개월</b></div>
            <div className="flex-1 rounded-[10px] bg-[#fce3d6] p-2.5 text-center text-[#8a2f0b]"><div className="text-xs font-semibold">미납</div><b className="text-xl">{unpaidN}개월</b></div>
          </div>
        </CardContent>
      </Card>

      {admin && <div className="px-4 pt-3"><ExceptionToggle /></div>}

      <div className={admin ? "ptable admin" : "ptable"}>
        <div className="prow phead">
          <div className="ym">년월</div>
          <div className="pc">납부 여부</div>
        </div>
        {rows.map((ym) => (
          <div className="prow" key={ym}>
            <div className={ym === curYm ? "ym cur" : "ym"} aria-current={ym === curYm ? "date" : undefined}>
              {ym.replace("-", ".")}
              {ym === curYm && (
                <CircleCheck size={14} strokeWidth={2.6} aria-label="이번 달" />
              )}
            </div>
            <div className="pc">
              <PayCell kind={kind(member.joined_at, ym, paid.get(ym), curYm)} memberId={member.id} name={member.name} ym={ym} />
            </div>
          </div>
        ))}
      </div>
      <div className="h-8" aria-hidden="true" />
    </PayEditorProvider>
  );
}
