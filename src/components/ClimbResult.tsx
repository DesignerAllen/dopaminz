import { AXES, MATE_LABEL, bestPairText, findType, isBorderline, rankTypes, typeKeyOf } from "@/lib/climbmate";
import { cn } from "@/lib/utils";

/** 결과 본문(읽기 전용, 공유 화면과 내 결과 화면 공용). axes = 축별 오른쪽 선택 수(0~3). crewNames = 유형 키별 크루원 이름(있으면 클메이트 유형 카드 안에 이름만 표시). 궁합 점수는 표시하지 않는다 */
export default function ClimbResult({ axes, crewNames, owner }: { axes: number[]; crewNames?: Record<string, string[]>; owner?: string | null }) {
  const key = typeKeyOf(axes);
  const type = findType(key)!;
  const mates = rankTypes(key);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[14px] bg-primary px-5 py-6 text-primary-foreground" aria-label="내 유형">
        {owner && <p className="text-[15px] opacity-90">{owner}님은</p>}
        <h2 className="mt-0.5 text-[28px] leading-tight font-bold">{type.alias}</h2>
        <p className="mt-1.5 text-[15px] opacity-90">{type.catch}</p>
      </section>

      <p className="text-[15px] leading-relaxed">{type.desc}</p>

      <section aria-label="강점" className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{owner ? `${owner}님의` : "나의"} 강점</h3>
        <ul className="flex flex-wrap gap-1.5">
          {type.strengths.map((s) => <li key={s} className="rounded-full bg-secondary px-3 py-1.5 text-sm">{s}</li>)}
        </ul>
        <div className="mt-1 rounded-[10px] border bg-card p-3.5 text-sm leading-relaxed"><b className="mr-1.5">성장 팁</b>{type.tip}</div>
      </section>

      <section aria-label="축별 응답" className="flex flex-col gap-3.5">
        <h3 className="text-sm font-semibold text-muted-foreground">{owner ? `${owner}님의 선택` : "내 선택 한눈에 보기"}</h3>
        {AXES.map((ax, i) => {
          const right = axes[i];
          const left = 3 - right;
          const rightWins = right >= 2;
          return (
            <div key={ax.name}>
              <div className="mb-1 flex items-baseline justify-between text-[13px]">
                <span className={cn(!rightWins && "font-semibold text-primary")}>{ax.left} {left}</span>
                <span className="text-xs text-muted-foreground">{ax.name}</span>
                <span className={cn(rightWins && "font-semibold text-primary")}>{right} {ax.right}</span>
              </div>
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${ax.left} ${left}, ${ax.right} ${right}`}>
                {[0, 1, 2].map((n) => <div key={n} className={cn("flex-1", n < left ? "bg-primary" : "bg-secondary")} />)}
                {[0, 1, 2].map((n) => <div key={n} className={cn("flex-1", n < right ? "bg-primary" : "bg-secondary")} />)}
              </div>
              {isBorderline(right) && (
                <p className="mt-1 text-xs text-muted-foreground">가끔은 {rightWins ? ax.left : ax.right} 모습도 보여요</p>
              )}
            </div>
          );
        })}
      </section>

      <section aria-label="클메이트 유형" className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{owner ? `${owner}님의 클메이트` : "나와 어울리는 클메이트"}</h3>
        {mates.map(({ kind, type: t }) => {
          const pair = kind === "best" ? bestPairText(key, t.key) : null;
          return (
            <div key={kind} className={cn("rounded-[10px] border p-3.5", kind === "best" ? "border-primary bg-card" : "bg-card")}>
              <div className={cn("text-xs font-semibold", kind === "best" ? "text-primary" : "text-muted-foreground")}>{MATE_LABEL[kind]}</div>
              <div className="mt-0.5 text-base font-semibold">{t.alias}</div>
              <div className="text-[13px] text-muted-foreground">{t.catch}</div>
              {crewNames && (
                <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label={`${t.alias} 크루원`}>
                  {crewNames[t.key]?.length ? crewNames[t.key].map((n) => <li key={n} className="rounded-full bg-secondary px-2.5 py-1 text-[13px] font-medium">{n}</li>) : <li className="text-[13px] text-muted-foreground">아직 크루에 없어요</li>}
                </ul>
              )}
              {pair && <p className="mt-2.5 text-sm leading-relaxed">{pair}</p>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
