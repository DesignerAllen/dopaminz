"use client";

import { useCallback, useMemo, useState } from "react";
import { MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import SlotMachine from "@/components/SlotMachine";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { copyText } from "@/lib/clipboard";
import { REGIONS, type Gym, type GymRegion } from "@/lib/gyms";

/** 암장 랜덤뽑기 메인: 권역 체크박스 → 슬롯 → 지도·공유 버튼(다시 돌리기는 레버) */
export default function GymRoulette({ gyms }: { gyms: Gym[] }) {
  const [regions, setRegions] = useState<GymRegion[]>(["seoul"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Gym | null>(null);

  const pool = useMemo(() => gyms.filter((g) => regions.includes(g.region)), [gyms, regions]);

  const onSpinStart = useCallback(() => { setSpinning(true); setResult(null); }, []);
  const onResult = useCallback((g: Gym) => { setSpinning(false); setResult(g); }, []);

  async function share() {
    if (!result) return;
    const url = `${location.origin}/gym-roulette/r/${result.id}`;
    const data = { title: "암장 룰렛", text: `오늘은 ${result.name} 가자!`, url };
    if (typeof navigator.share === "function" && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) {
      try { await navigator.share(data); return; } catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    toast(await copyText(url) ? "결과 링크를 복사했어요" : "링크 복사에 실패했어요");
  }

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <fieldset className="flex items-center gap-5 px-4 pt-1" disabled={spinning} aria-label="권역 선택">
        {REGIONS.map((r) => (
          <label key={r.value} className="flex items-center gap-2 text-[15px]">
            <Checkbox
              className="size-5"
              checked={regions.includes(r.value)}
              onCheckedChange={(on) => {
                const next = on === true ? [...regions, r.value] : regions.filter((v) => v !== r.value);
                if (next.length) { setRegions(next); setResult(null); } // 최소 1개는 선택
              }}
            />
            {r.label}
          </label>
        ))}
      </fieldset>

      <SlotMachine pool={pool} onSpinStart={onSpinStart} onResult={onResult} />

      {result && !spinning && (
        <section className="grid grid-cols-2 gap-2 px-4" aria-label="뽑기 결과">
          <Button asChild variant="outline">
            <a href={`https://map.naver.com/p/search/${encodeURIComponent(result.name)}`} target="_blank" rel="noopener noreferrer"><MapPin data-icon="inline-start" />네이버지도</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`https://map.kakao.com/link/search/${encodeURIComponent(result.name)}`} target="_blank" rel="noopener noreferrer"><MapPin data-icon="inline-start" />카카오지도</a>
          </Button>
          <Button className="col-span-2" onClick={share}><Share2 data-icon="inline-start" />공유하기</Button>
        </section>
      )}
    </main>
  );
}
