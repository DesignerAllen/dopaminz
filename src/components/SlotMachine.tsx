"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Gym } from "@/lib/gyms";

// 배경 이미지(public/gym-roulette-bg-v2.webp, 1122×1402) 기준 영역을 % 로 환산한 값.
// 가운데 빈 릴 창과 레버(빨간 공) 위치에 투명 요소를 올려 텍스트·조작을 얹는다.
const IMG = { w: 1122, h: 1402 };
const pct = (x: number, y: number, w: number, h: number) => ({
  left: `${(x / IMG.w) * 100}%`, top: `${(y / IMG.h) * 100}%`, width: `${(w / IMG.w) * 100}%`, height: `${(h / IMG.h) * 100}%`,
});
const WIN = pct(190, 696, 734, 308); // 텍스트가 들어가는 릴 창(크림색 빈 부분의 안쪽)
// 레버 이미지(public/gym-roulette-lever-v2.webp, 264×720): 몸체 오른쪽 가장자리에 세운다. 아래쪽 끝이 당길 때의 축.
const LEVER = pct(1004, 560, 106, 289);
const LEVER_BALL = { x: 0.68, y: 0.13, w: 0.7 }; // 레버 이미지 안 빨간 공의 중심(비율)·지름 비율

const STRIP_LEN = 36; // 회전 중 지나가는 칸 수(마지막 칸이 당첨)

export type SlotState = "idle" | "spinning" | "stopped";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** 슬롯머신: 일러스트 배경 위에 가운데 릴 창을 얹은 컴포넌트. 레버(클릭·키보드)를 당기면
 *  창 안의 암장명이 회전하다 서서히 감속해 미리 정해둔 당첨 암장에서 멈춘다. */
export default function SlotMachine({ pool, disabled, onSpinStart, onResult }: {
  pool: Gym[];
  disabled?: boolean;
  onSpinStart?: () => void;
  onResult: (gym: Gym) => void;
}) {
  const [state, setState] = useState<SlotState>("idle");
  const [strip, setStrip] = useState<Gym[]>([]);
  const [pulled, setPulled] = useState(false);
  const reelRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const stateRef = useRef<SlotState>("idle");
  stateRef.current = state;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // 권역(pool)이 바뀌면 릴을 초기화
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    stateRef.current = "idle";
    setState("idle");
    setStrip([]);
  }, [pool]);

  const spin = useCallback(() => {
    if (stateRef.current === "spinning" || pool.length === 0) return;
    const winner = pool[Math.floor(Math.random() * pool.length)]; // 정지 전에 결과 확정
    // 지나가는 칸: 같은 암장이 연달아 나오지 않게 채우고 마지막 칸이 당첨
    const items: Gym[] = [];
    for (let i = 0; i < STRIP_LEN - 1; i++) {
      let g: Gym;
      do g = pool[Math.floor(Math.random() * pool.length)]; while (pool.length > 1 && g === items[i - 1]);
      items.push(g);
    }
    if (pool.length > 1 && items[items.length - 1] === winner) items[items.length - 1] = pool.find((g) => g !== winner)!;
    items.push(winner);
    stateRef.current = "spinning";
    setStrip(items);
    setState("spinning");
    onSpinStart?.();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 600 : 3800;
    const travel = ((items.length - 1) / items.length) * 100; // 릴 전체 높이 대비 % (마지막 칸까지)
    const t0 = performance.now();
    // 릴 요소는 setStrip 이후 렌더되므로 매 프레임 ref 를 다시 읽는다
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const el = reelRef.current;
      if (el) el.style.transform = `translateY(${-travel * easeOutCubic(p)}%)`;
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else {
        stateRef.current = "stopped";
        setState("stopped");
        onResult(winner);
      }
    };
    if (reelRef.current) reelRef.current.style.transform = "translateY(0)";
    raf.current = requestAnimationFrame(tick);
  }, [pool, onSpinStart, onResult]);

  const locked = disabled || state === "spinning" || pool.length === 0;

  const pullLever = () => {
    if (locked) return;
    setPulled(true); // 레버가 앞으로 당겨졌다 돌아오는 모션
    setTimeout(() => setPulled(false), 380);
    spin();
  };

  const current = strip[strip.length - 1];

  return (
    <div className="w-full [container-type:inline-size]">
      <div className="relative" style={{ aspectRatio: `${IMG.w} / ${IMG.h}` }}>
        <Image src="/gym-roulette-bg-v2.webp" alt="" width={IMG.w} height={IMG.h} priority unoptimized className="absolute inset-0 size-full select-none" draggable={false} />

        {/* 가운데 릴 창: 암장명 텍스트 영역 */}
        <div className="absolute overflow-hidden rounded-[2.5cqw]" style={WIN} role="img" aria-label={state === "stopped" && current ? `결과: ${current.name}` : "암장 슬롯 릴"}>
          {state === "idle" ? (
            <div className="flex h-full items-center justify-center px-[3cqw] text-center font-bold break-keep text-[#5b3b24]/70" style={{ fontSize: "5.2cqw" }}>레버를 눌러 암장을 돌리세요</div>
          ) : (
            <div ref={reelRef} className="will-change-transform" style={{ height: `${strip.length * 100}%` }} aria-hidden="true">
              {strip.map((g, i) => (
                <div key={i} className="flex items-center justify-center px-[3cqw] text-center leading-tight font-extrabold break-keep text-[#3a2312]" style={{ height: `${100 / strip.length}%`, fontSize: "6.4cqw", textShadow: "0 1px 0 rgba(255,255,255,.7)" }}>
                  <span className="line-clamp-2">{g.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 레버: 누르면 아래쪽 축을 기준으로 앞으로 당겨졌다 돌아온다 */}
        <button
          type="button"
          aria-label="레버 당기기"
          disabled={locked}
          onClick={pullLever}
          className="absolute cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-amber-300/80 disabled:cursor-default"
          style={{ ...LEVER, perspective: "40cqw" }}
        >
          <span
            className="relative block size-full"
            style={{
              transformOrigin: "50% 96%",
              transform: pulled ? "rotateX(64deg) scaleY(.92)" : "rotateX(0deg)",
              transition: pulled ? "transform 170ms cubic-bezier(.4,0,.9,.6)" : "transform 420ms cubic-bezier(.2,.9,.3,1.25)",
            }}
          >
            <Image src="/gym-roulette-lever-v2.webp" alt="" width={264} height={720} unoptimized draggable={false} className="size-full select-none" />
            {state === "idle" && (
              <span
                className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full ring-2 ring-amber-200/70"
                style={{ left: `${LEVER_BALL.x * 100}%`, top: `${LEVER_BALL.y * 100}%`, width: `${LEVER_BALL.w * 100 + 8}%` }}
                aria-hidden="true"
              />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

/** 공유 결과 페이지용: 같은 배경·레버 위에 결과 암장명만 정지 상태로 보여준다(조작 없음). */
export function SlotResultView({ name }: { name: string }) {
  return (
    <div className="w-full [container-type:inline-size]">
      <div className="relative" style={{ aspectRatio: `${IMG.w} / ${IMG.h}` }}>
        <Image src="/gym-roulette-bg-v2.webp" alt="" width={IMG.w} height={IMG.h} priority unoptimized className="absolute inset-0 size-full select-none" draggable={false} />
        <div className="absolute overflow-hidden rounded-[2.5cqw]" style={WIN} role="img" aria-label={`결과: ${name}`}>
          <div className="flex h-full items-center justify-center px-[3cqw] text-center leading-tight font-extrabold break-keep text-[#3a2312]" style={{ fontSize: "6.4cqw", textShadow: "0 1px 0 rgba(255,255,255,.7)" }}>
            <span className="line-clamp-2">{name}</span>
          </div>
        </div>
        <div className="absolute" style={LEVER} aria-hidden="true">
          <Image src="/gym-roulette-lever-v2.webp" alt="" width={264} height={720} unoptimized draggable={false} className="size-full select-none" />
        </div>
      </div>
    </div>
  );
}
