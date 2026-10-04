import { SERVICE_START, kindForAdmin, kindOf, miToYm, summarize, todayKst, ymToMi } from "@/lib/payment-rules";
import { loadActiveMembers, loadActivePaymentsAll, loadLatestPaidMonth, loadNotice } from "@/lib/status-data";
import CopyAccount from "./CopyAccount";
import MonthCarousel, { type Panel } from "./MonthCarousel";
import { ExceptionToggle, PayEditorProvider } from "./PayEditor";

/** 월별 납부 현황 표. 크루원 화면(읽기 전용)과 관리자 화면(체크 편집)이 함께 쓴다.
 *  personBase: 이름을 눌렀을 때 이동할 인원별 화면 주소(뒤에 ?m=<id>가 붙는다). */
export default async function StatusBody({ admin, personBase, showNotice }: { admin: boolean; personBase: string; showNotice: boolean }) {
  const curYm = todayKst().slice(0, 7);
  const curMi = ymToMi(curYm);
  const firstMi = ymToMi(SERVICE_START);

  // 이동 범위: 가장 이른 창은 서비스 시작 월부터, 미래로는 현재 창 외에 2개 창(분기)까지 항상 볼 수 있다.
  // 예외: 그보다 먼 달에 선납 기록이 있으면 그 달이 들어가는 창까지 이동할 수 있다.
  const FUTURE_WINDOWS = 2;
  const latest = await loadLatestPaidMonth();
  const latestMi = latest ? ymToMi(latest) : curMi;
  const baseMax = curMi + 3 * FUTURE_WINDOWS;
  const maxStartMi = latestMi > baseMax + 2 ? baseMax + 3 * Math.ceil((latestMi - (baseMax + 2)) / 3) : baseMax;

  // 창(3개월) 시작 월 목록: 이번 달 기준으로 3개월씩 과거로(서비스 시작 월까지), 미래로는 현재 창 + 2개 창(maxStart)까지
  const starts = new Set<number>([curMi]);
  for (let m = curMi - 3; ; m -= 3) {
    if (m <= firstMi) { starts.add(firstMi); break; }
    starts.add(m);
  }
  for (let m = curMi + 3; m <= maxStartMi; m += 3) starts.add(m);
  const uniq = [...starts].sort((x, y) => x - y);
  const defaultIndex = Math.max(0, uniq.indexOf(curMi));

  const [notice, members, payments] = await Promise.all([loadNotice(), loadActiveMembers(), loadActivePaymentsAll()]);
  const paid = new Map(payments.map((p) => [`${p.member_id}|${p.year_month}`, p]));
  const kind = admin ? kindForAdmin : kindOf;

  const panels: Panel[] = uniq.map((st) => {
    const months = [0, 1, 2].map((k) => miToYm(st + k));
    const rows = members.map((m) => ({
      id: m.id,
      name: m.name,
      joined_at: m.joined_at,
      kinds: months.map((ym) => kind(m.joined_at, ym, paid.get(`${m.id}|${ym}`), curYm)),
    }));
    const sums = months.map((_, i) => {
      const x = summarize(rows.map((r) => r.kinds[i]));
      return { paid: x.paid, unpaid: x.unpaid, upcoming: x.upcoming };
    });
    return { months, rows, sums };
  });

  return (
    <PayEditorProvider editable={admin}>
      {showNotice && (
        <section className="mx-4 mt-2 rounded-[10px] bg-primary p-4 text-primary-foreground" aria-label="월 회비 안내">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] text-primary-foreground/70">월 회비</div>
              <div className="text-2xl leading-tight font-semibold">{notice.notice_fee || "-"}</div>
            </div>
            {notice.notice_account && <CopyAccount account={notice.notice_account} />}
          </div>
          <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-[13px] leading-snug break-keep">원활한 크루 운영을 위해서 납부 부탁드려요 🙏</p>
        </section>
      )}

      {admin && <div className="px-4 pt-2.5"><ExceptionToggle /></div>}

      <MonthCarousel panels={panels} curYm={curYm} defaultIndex={defaultIndex} admin={admin} personBase={personBase} />
      <div className="h-8" aria-hidden="true" />
    </PayEditorProvider>
  );
}
