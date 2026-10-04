// 회비 납부 규칙(기획안 4장). 서버·클라이언트 어디서든 쓸 수 있는 순수 함수만 둔다.

export type Kind = "na" | "free" | "exception" | "paid" | "unpaid" | "upcoming" | "warn";

export const SERVICE_START = "2025-07"; // 서비스 시작 월 = 가장 이른 분기 2025년 3분기

/** 한국 시간 기준 오늘 날짜(YYYY-MM-DD) */
export function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** 2025-01 을 0으로 하는 월 번호 */
export const ymToMi = (ym: string) => (+ym.slice(0, 4) - 2025) * 12 + +ym.slice(5, 7) - 1;
export const miToYm = (mi: number) => `${2025 + Math.floor(mi / 12)}-${pad((mi % 12) + 1)}`;

/** 분기 번호: 0 = 2025년 3분기(2025-07~09) */
export const quarterOf = (ym: string) => Math.floor((ymToMi(ym) - ymToMi(SERVICE_START)) / 3);
export const quarterMonths = (q: number) => [0, 1, 2].map((k) => miToYm(ymToMi(SERVICE_START) + q * 3 + k));

export function quarterTitle(q: number) {
  const [first] = quarterMonths(q);
  const month = +first.slice(5, 7);
  return `${first.slice(0, 4)}년 ${Math.floor((month - 1) / 3) + 1}분기`;
}
export function quarterRange(q: number) {
  const m = quarterMonths(q);
  return `${m[0]} ~ ${m[2]}`;
}

/** 가입일·납부 기록·현재 월로 월별 상태를 계산한다. 상태는 DB에 저장하지 않는다. */
export function kindOf(joinedAt: string, ym: string, payment: { is_exception: boolean } | undefined, curYm: string): Kind {
  const joinYm = joinedAt.slice(0, 7);
  if (ym < joinYm) return "na"; // 가입 이전 달 (기록이 있어도 뷰어에는 '-')
  if (ym === joinYm) return payment ? "exception" : "free";
  if (payment) return "paid";
  return ym <= curYm ? "unpaid" : "upcoming";
}

export const KIND_LABEL: Record<Kind, string> = {
  na: "-",
  free: "-",
  exception: "예외",
  paid: "납부",
  unpaid: "미납",
  upcoming: "예정",
  warn: "확인",
};

export type MonthSummary = { paid: number; unpaid: number; upcoming: number; targets: number; rate: number | null };

/** 월별 집계: 납부율 = 납부(예외 포함) ÷ 납부 대상. 면제 가입달은 분모 제외, 예외 납부는 포함. */
export function summarize(kinds: Kind[]): MonthSummary {
  let paid = 0, unpaid = 0, upcoming = 0;
  for (const k of kinds) {
    if (k === "paid" || k === "exception") paid++;
    else if (k === "unpaid") unpaid++;
    else if (k === "upcoming") upcoming++;
  }
  const targets = paid + unpaid + upcoming;
  return { paid, unpaid, upcoming, targets, rate: targets ? Math.round((paid / targets) * 100) : null };
}

/** 관리자 화면용: 가입 이전 달에 납부 기록이 있으면 'warn'(경고)으로 보여준다. */
export function kindForAdmin(joinedAt: string, ym: string, payment: { is_exception: boolean } | undefined, curYm: string): Kind {
  const k = kindOf(joinedAt, ym, payment, curYm);
  return k === "na" && payment ? "warn" : k;
}
