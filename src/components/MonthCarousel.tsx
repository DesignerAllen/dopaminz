"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Kind } from "@/lib/payment-rules";
import { PayCell } from "./PayEditor";
import { ChevronLeft, ChevronRight, CircleCheck } from "lucide-react";
import MemberCombobox from "./MemberCombobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import SortSelect from "./SortSelect";
import { DEFAULT_SORT, sortMembers, type SortKey } from "@/lib/member-sort";

export type Panel = {
  months: string[];
  sums: { paid: number; unpaid: number; upcoming: number }[];
  rows: { id: number; name: string; joined_at: string; kinds: Kind[] }[];
};

/** 2026년 7~9월 (해가 바뀌면 2026년 11월 ~ 2027년 1월) */
function rangeLabel(months: string[]) {
  const [y1, m1] = [months[0].slice(0, 4), +months[0].slice(5, 7)];
  const [y2, m2] = [months[2].slice(0, 4), +months[2].slice(5, 7)];
  return y1 === y2 ? `${y1}년 ${m1}~${m2}월` : `${y1}년 ${m1}월 ~ ${y2}년 ${m2}월`;
}

/** 3개월 표를 캐러셀처럼 좌우로 밀어 넘긴다. 손가락/마우스를 따라 움직이고 놓으면 가장 가까운 칸에 붙는다. */
export default function MonthCarousel({ panels, curYm, defaultIndex, admin, personBase }: { panels: Panel[]; curYm: string; defaultIndex: number; admin: boolean; personBase: string }) {
  const [idx, setIdx] = useState(defaultIndex);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [onlyUnpaid, setOnlyUnpaid] = useState(false); // 미납만 보기(기본 해제)
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const g = useRef<{ x: number; y: number; t: number; lastX: number; locked: boolean } | null>(null);
  const suppress = useRef(false);
  const view = useRef<HTMLDivElement>(null);
  const last = panels.length - 1;
  const idxRef = useRef(idx);
  idxRef.current = idx;

  const clamp = (n: number) => Math.min(Math.max(n, 0), last);
  const cur = panels[idx];
  const kw = q.trim();
  // 미납만 보기: 전체 기간(모든 창의 모든 달) 중 미납이 한 번이라도 있는 행. 모든 칼럼이 같은 행 목록을 써야 줄이 맞는다.
  const unpaidIds = new Set(panels.flatMap((p) => p.rows.filter((r) => r.kinds.includes("unpaid")).map((r) => r.id)));
  const visible = (r: { id: number; name: string }) =>
    (sel !== null ? r.id === sel : kw ? r.name.includes(kw) : true) && (!onlyUnpaid || unpaidIds.has(r.id));
  // 이름 옆에 보여줄 미납 개월 수: 전체 기간 기준(창이 겹쳐도 같은 달은 한 번만 센다)
  const unpaidMonths = new Map<number, Set<string>>();
  panels.forEach((p) => p.rows.forEach((r) => r.kinds.forEach((k, i) => {
    if (k === "unpaid") (unpaidMonths.get(r.id) ?? unpaidMonths.set(r.id, new Set()).get(r.id)!).add(p.months[i]);
  })));
  const options = panels[0].rows.map((r) => ({ id: r.id, name: r.name }));
  // 이름 칼럼과 모든 월 칼럼이 같은 순서·같은 필터를 쓴다
  const order = new Map(sortMembers(panels[0].rows, sort).map((r, i) => [r.id, i]));
  const arrange = <T extends { id: number; name: string }>(rows: T[]) => rows.filter(visible).sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  // 제스처 공통 로직: 마우스(포인터 이벤트)와 터치(터치 이벤트)가 함께 사용한다.
  const begin = (x: number, y: number) => { g.current = { x, y, t: Date.now(), lastX: x, locked: false }; };
  /** 가로 드래그로 확정되면 true */
  const move = (x: number, y: number): boolean => {
    const s = g.current;
    if (!s) return false;
    s.lastX = x;
    const dx = x - s.x, dy = y - s.y;
    if (!s.locked) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return false;
      s.locked = true;
      setDragging(true);
    }
    const i = idxRef.current;
    const atEdge = (i === 0 && dx > 0) || (i === last && dx < 0);
    setDragX(atEdge ? dx * 0.3 : dx);
    return true;
  };
  const end = (x: number) => {
    const s = g.current;
    g.current = null;
    if (!s?.locked) return;
    const w = view.current?.clientWidth ?? 360;
    const dx = x - s.x;
    const fast = Math.abs(dx) / Math.max(1, Date.now() - s.t) > 0.5; // px/ms
    if (Math.abs(dx) > w * 0.25 || (fast && Math.abs(dx) > 30)) setIdx(clamp(idxRef.current + (dx < 0 ? 1 : -1)));
    setDragging(false);
    setDragX(0);
    suppress.current = true; // 드래그 직후 칸이 눌리는 것을 막는다
    setTimeout(() => (suppress.current = false), 0);
  };
  const cancel = () => { g.current = null; setDragging(false); setDragX(0); };

  // 터치: iOS 에서도 안정적으로 동작하도록 터치 이벤트를 직접 사용한다(가로 드래그 중에는 세로 스크롤 방지).
  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const ts = (e: TouchEvent) => { if (e.touches.length === 1) begin(e.touches[0].clientX, e.touches[0].clientY); else cancel(); };
    const tm = (e: TouchEvent) => { if (e.touches.length === 1 && move(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault(); };
    const te = (e: TouchEvent) => end(e.changedTouches[0]?.clientX ?? g.current?.lastX ?? 0);
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te);
    el.addEventListener("touchcancel", cancel);
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
      el.removeEventListener("touchcancel", cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last]);

  // 마우스: 버튼이 떼어진 것을 놓치면 이동 이벤트에서 끝낸다.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    begin(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !g.current) return;
    if (e.buttons === 0) { end(e.clientX); return; }
    if (move(e.clientX, e.clientY)) { try { view.current?.setPointerCapture(e.pointerId); } catch {} }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    try { view.current?.releasePointerCapture(e.pointerId); } catch {}
    end(e.clientX);
  };

  return (
    <>
      <div className="relative z-(--z-search) px-4 pt-6 pb-3">
        <div className="flex items-start gap-2">
          <SortSelect value={sort} onChange={setSort} />
          <MemberCombobox options={options} selectedId={sel} onSelect={setSel} query={q} onQuery={setQ} />
        </div>
        <label className="mt-3 flex min-h-8 w-fit cursor-pointer items-center gap-2 text-sm">
          <Checkbox className="size-5" checked={onlyUnpaid} onCheckedChange={(v) => setOnlyUnpaid(v === true)} />
          미납만 보기
        </label>
      </div>

      <div className={admin ? "range-bar admin" : "range-bar"}>
        <div className="text-[15px] font-semibold" aria-live="polite">
          {rangeLabel(cur.months)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIdx(clamp(idx - 1))} disabled={idx === 0} aria-label="이전 3개월"><ChevronLeft /></Button>
          <Button variant="outline" size="icon" onClick={() => setIdx(clamp(idx + 1))} disabled={idx === last} aria-label="다음 3개월"><ChevronRight /></Button>
        </div>
      </div>

      <div className={admin ? "mgrid admin" : "mgrid"}>
        {/* 고정 영역: 이름 칼럼 */}
        <div className="namecol">
          <div className="hcell">이름</div>
          <div className="hcell sumcell">미납 인원</div>
          {arrange(panels[0].rows).map((r) => (
            <Link key={r.id} href={`${personBase}?m=${r.id}`} className="nrow" aria-label={`${r.name} 납부 현황 보기${unpaidMonths.get(r.id) ? `, 미납 ${unpaidMonths.get(r.id)!.size}개월` : ""}`}>
              <span className="min-w-0 truncate">{r.name}</span>
              {unpaidMonths.get(r.id) && <span className="flex-none text-[11px] font-normal text-[#8a2f0b]">미납{unpaidMonths.get(r.id)!.size}</span>}
            </Link>
          ))}
        </div>

        {/* 좌우로 넘어가는 영역: 월 칼럼 */}
        <div
          ref={view}
          className="carousel"
          tabIndex={0}
          role="group"
          aria-label="월별 납부 현황. 좌우 화살표 키나 드래그로 3개월씩 이동해요"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onLostPointerCapture={() => g.current && end(g.current.lastX)}
          onDragStart={(e) => e.preventDefault()}
          onClickCapture={(e) => {
            if (suppress.current) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setIdx(clamp(idx - 1));
            if (e.key === "ArrowRight") setIdx(clamp(idx + 1));
          }}
        >
          <div className={dragging ? "track dragging" : "track"} style={{ transform: `translateX(calc(${-idx * 100}% + ${dragX}px))` }}>
            {panels.map((p, pi) => (
              <div key={p.months[0]} className="panel" aria-hidden={pi !== idx} inert={pi !== idx}>
                <div className="mrow mhrow">
                  {p.months.map((ym) => (
                    <div key={ym} className="mhead" aria-current={ym === curYm ? "date" : undefined}>
                      {+ym.slice(5, 7)}월
                      {ym === curYm && (
                        <CircleCheck size={14} strokeWidth={2.6} aria-label="이번 달" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mrow msrow">
                  {p.sums.map((x, i) => {
                    const future = p.months[i] > curYm;
                    return (
                      <div key={p.months[i]} className="sum1" style={{ color: !future && x.unpaid ? "#8a2f0b" : "var(--fg-muted)" }}>
                        {future ? "-" : `미납 ${x.unpaid}명`}
                      </div>
                    );
                  })}
                </div>
                {arrange(p.rows).map((r) => (
                  <div className="mrow" key={r.id}>
                    {r.kinds.map((k, i) => (
                      <PayCell key={p.months[i]} kind={k} memberId={r.id} name={r.name} ym={p.months[i]} />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {panels[0].rows.filter(visible).length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">{panels[0].rows.length === 0 ? "등록된 회원이 없어요" : onlyUnpaid && sel === null && !kw ? "미납한 크루원이 없어요" : "검색 결과가 없어요"}</div>}
    </>
  );
}
