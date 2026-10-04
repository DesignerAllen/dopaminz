"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TicketRequest } from "@/lib/tickets";

const ALL = "all";

/** 크루권 목록 필터: 센터 선택(기본 전체) + 이름 검색(크루원·게스트 모두).
 *  이름은 입력하는 대로 걸러진다(선택 목록 없음). */
export function useTicketFilter(requests: TicketRequest[], centers: string[]) {
  const [center, setCenter] = useState(ALL);
  const [query, setQuery] = useState("");
  const q = query.trim();

  const filtered = requests.filter(
    (r) => (center === ALL || r.center_name === center) && (!q || r.people.some((p) => p.name.includes(q))),
  );
  const active = center !== ALL || q !== "";

  const bar = (
    <div className="flex items-start gap-2">
      <Select value={center} onValueChange={setCenter}>
        <SelectTrigger aria-label="센터별 보기" className="h-11 w-36 flex-none bg-white text-sm">
          <SelectValue>{center === ALL ? "전체 센터" : center}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectItem value={ALL}>전체</SelectItem>
          {centers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          aria-label="이름 검색"
          placeholder="이름 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && (e.target as HTMLInputElement).blur()}
          className="h-11 rounded-[10px] bg-white pr-10 pl-9 text-base"
        />
        {query && (
          <button type="button" aria-label="검색 초기화" onClick={() => setQuery("")} className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground">
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
  return { bar, filtered, active };
}
