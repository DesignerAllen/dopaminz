import type { TicketRequest } from "./tickets";

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const kst = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

/** 크루권 사용 내역 CSV: 이용자 한 명이 한 줄. 엑셀·구글 시트·numbers 에서 한글이 깨지지 않도록 UTF-8 BOM 을 붙인다. */
export function ticketsToCsv(requests: TicketRequest[]): string {
  const head = ["사용일", "센터", "지점", "구분", "이름", "크루원/게스트", "금액", "납부", "신청 상태", "신청일시", "신청번호"];
  const rows: (string | number)[][] = [];
  // 사용일 오래된 순(스프레드시트에서 이어 붙이기 좋게)
  for (const r of [...requests].sort((a, b) => a.used_on.localeCompare(b.used_on) || a.created_at.localeCompare(b.created_at))) {
    const canceled = r.status === "canceled";
    for (const p of r.people) {
      rows.push([r.used_on.slice(0, 10), r.center_name, r.branch_name ?? "", r.item_name, p.name, p.is_guest ? "게스트" : "크루원", p.unit_price, canceled ? "" : p.paid ? "납부" : "미납", canceled ? "취소됨" : "정상", kst(r.created_at), r.id]);
    }
  }
  return "﻿" + [head, ...rows].map((row) => row.map(esc).join(",")).join("\r\n") + "\r\n";
}

export function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
