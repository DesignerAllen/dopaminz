/** 2026-11-02 → 2026년 11월 2일 (월·일 앞자리 0 없음) */
export const korDate = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return `${y}년 ${m}월 ${day}일`;
};
