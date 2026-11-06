import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** 토스 디자인 시스템(TDS mobile) 스타일 빌딩블록. 색은 @toss/tds-colors 값, 간격은 ListRow/ListHeader/Border 문서 기준.
 *  현재 메인 화면에만 쓴다. */
export const tds = {
  grey50: "#f9fafb", grey100: "#f2f4f6", grey200: "#e5e8eb", grey400: "#b0b8c1", grey500: "#8b95a1", grey600: "#6b7684", grey700: "#4e5968", grey800: "#333d4b", grey900: "#191f28",
  red50: "#ffeeee", red500: "#f04452",
};

/** Border variant="height16": 섹션 사이 16px 회색 구분 */
/** 터치 기기용 press 인터렉션: 탭 하이라이트 제거 + 누르는 동안 살짝 작아지고(scale) 배경이 진해졌다가 떼면 부드럽게 복귀 */
export const press = "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] transition-[transform,background-color,opacity] duration-150 ease-out active:scale-[0.97]";
/** 행(전체 폭) 용: 크기는 거의 그대로 두고 배경만 눌림 표시 */
export const pressRow = "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] transition-[transform,background-color] duration-150 ease-out active:scale-[0.985] active:bg-[#f2f4f6]";

export function Border16() {
  return <div aria-hidden="true" className="h-4 flex-none bg-[#f2f4f6]" />;
}

/** ListHeader: 섹션 제목(t5 bold, grey800) + 오른쪽 보조 텍스트(t7, grey700) */
export function ListHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-2">
      <h2 className="text-[17px] leading-[25.5px] font-bold text-[#333d4b]">{title}</h2>
      {right && <div className="text-[13px] leading-[19.5px] text-[#4e5968]">{right}</div>}
    </div>
  );
}

/** AssetText squircle: 이모지 아이콘 영역 (배경 greyOpacity100) */
export function AssetText({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-[14px] bg-[#f2f4f6] text-[22px] leading-none">
      {children}
    </span>
  );
}

/** ListRow: left / contents(2RowTypeA: top t7 grey600 · bottom t5 semibold grey900) / right, 상하 12px · 좌우 24px, 눌림 효과 */
export function ListRow({ href, left, top, bottom, contents, right, withArrow = false }: { href?: string; left?: React.ReactNode; top?: string; bottom?: string; contents?: React.ReactNode; right?: React.ReactNode; withArrow?: boolean }) {
  const inner = (
    <>
      {left}
      <span className="min-w-0 flex-1">
        {contents ?? (
          <>
            {top && <span className="block text-[13px] leading-[19.5px] text-[#6b7684]">{top}</span>}
            <span className="block text-[17px] leading-[25.5px] font-semibold text-[#191f28]">{bottom}</span>
          </>
        )}
      </span>
      {right}
      {withArrow && <ChevronRight className="size-5 flex-none text-[#b0b8c1]" aria-hidden="true" />}
    </>
  );
  const cls = "flex items-center gap-4 px-6 py-3";
  return href ? (
    <Link href={href} className={cn(cls, pressRow)}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Badge (TDS 문서 BadgeProps): size·color·variant 모두 필수.
 *  size: xsmall | small | medium | large · color: blue | teal | green | red | yellow | elephant · variant: fill(채도 높음) | weak(채도 낮음).
 *  문서에 px 값은 없어서 높이·글자 크기는 TDS 타이포(t7 13 / st12 12 / st13 11)에 맞춰 잡았다. */
export type BadgeSize = "xsmall" | "small" | "medium" | "large";
export type BadgeColor = "blue" | "teal" | "green" | "red" | "yellow" | "elephant";
export type BadgeVariant = "fill" | "weak";

const BADGE_SIZE: Record<BadgeSize, string> = {
  xsmall: "h-[18px] rounded-[6px] px-1.5 text-[11px] leading-[16.5px]",
  small: "h-[22px] rounded-[7px] px-2 text-[12px] leading-[18px]",
  medium: "h-[26px] rounded-[8px] px-2.5 text-[13px] leading-[19.5px]",
  large: "h-[30px] rounded-[10px] px-3 text-[14px] leading-[21px]",
};
// fill: 500 계열 바탕 + 흰 글자 / weak: 50 계열 바탕 + 700 계열 글자 (elephant 는 회색)
const BADGE_COLOR: Record<BadgeColor, Record<BadgeVariant, string>> = {
  blue: { fill: "bg-[#3182f6] text-white", weak: "bg-[#e8f3ff] text-[#1b64da]" },
  teal: { fill: "bg-[#18a5a5] text-white", weak: "bg-[#edf8f8] text-[#0c8585]" },
  green: { fill: "bg-[#03b26c] text-white", weak: "bg-[#f0faf6] text-[#029359]" },
  red: { fill: "bg-[#f04452] text-white", weak: "bg-[#ffeeee] text-[#d22030]" },
  yellow: { fill: "bg-[#ffc342] text-[#191f28]", weak: "bg-[#fff9e7] text-[#dd7d02]" },
  elephant: { fill: "bg-[#4e5968] text-white", weak: "bg-[#f2f4f6] text-[#4e5968]" },
};

export function Badge({ size, color, variant, children }: { size: BadgeSize; color: BadgeColor; variant: BadgeVariant; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center justify-center font-semibold whitespace-nowrap", BADGE_SIZE[size], BADGE_COLOR[color][variant])}>{children}</span>;
}

/** Button size small · variant weak(연한 배경) / fill */
export const tdsButton = (variant: "weak" | "fill" = "weak") =>
  cn(press, "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[14px] font-semibold", variant === "fill" ? "bg-[#333d4b] text-white active:bg-[#191f28]" : "bg-[#f2f4f6] text-[#333d4b] active:bg-[#e5e8eb]");
