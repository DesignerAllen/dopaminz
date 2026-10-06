import type { TicketPass, TicketRequest } from "./tickets";

type UsageRequest = Pick<TicketRequest, "center_id" | "used_on" | "status" | "people">;

/** 구매분별 사용량. 센터별로 먼저 산(시작일이 빠른) 구매분부터 차감한다.
 *  사용 1회는 사용일에 유효한 구매분 중 가장 먼저 산 것에서 빠지고, 그 구매분이 다 찼으면 다음 구매분에서 빠진다.
 *  유효한 구매분이 없거나 모두 찬 사용은 어느 구매분에도 잡히지 않는다.
 *  취소된 이용자는 사용으로 세지 않는다(취소하면 차감된 횟수가 돌아온다). */
export function usedByPass(passes: TicketPass[], requests: UsageRequest[]): Map<number, number> {
  const used = new Map<number, number>(passes.map((p) => [p.id, 0]));
  const sorted = [...passes].sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id - b.id);
  const active = requests.filter((r) => r.status === "active").sort((a, b) => a.used_on.localeCompare(b.used_on));
  for (const r of active) {
    const day = r.used_on.slice(0, 10);
    let left = r.people.filter((p) => !p.canceled_at).length;
    for (const p of sorted) {
      if (left <= 0) break;
      if (p.center_id !== r.center_id || day < p.start_date || day > p.end_date) continue;
      const take = Math.min(left, p.quantity - used.get(p.id)!);
      if (take <= 0) continue;
      used.set(p.id, used.get(p.id)! + take);
      left -= take;
    }
  }
  return used;
}

/** 센터별 잔여 횟수. 종료일이 지나지 않은 구매분만 합산하고, 구매분이 없으면 null(표시 안 함) */
export function remainingByCenter(passes: TicketPass[], requests: UsageRequest[], today: string): Map<number, number> {
  const used = usedByPass(passes, requests);
  const out = new Map<number, number>();
  for (const p of passes) {
    if (p.end_date < today) continue;
    out.set(p.center_id, (out.get(p.center_id) ?? 0) + p.quantity - used.get(p.id)!);
  }
  return out;
}

/** 시작일의 1년 뒤 같은 날짜(기본 종료일) */
export const addYear = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y + 1, m - 1, day)).toISOString().slice(0, 10);
};
