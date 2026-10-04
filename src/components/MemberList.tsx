"use client";

import { useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import MemberCombobox from "./MemberCombobox";
import SortSelect from "./SortSelect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SORT, sortMembers, type SortKey } from "@/lib/member-sort";

type M = { id: number; name: string; joined_at: string; instagram_id: string | null };

const NEW_DAYS = 30; // 가입 후 30일까지는 신규 크루원

/** 가입일부터 오늘까지 지난 일수(당일 = 0). 날짜만 비교한다. */
function daysSince(joined: string, today: string) {
  const d = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.max(0, Math.round((d(today) - d(joined)) / 86_400_000));
}

/** 크루원 목록: 콤보박스로 선택하면 그 인원만, 입력 중에는 이름이 포함된 인원만 보여준다. */
export default function MemberList({ members, today }: { members: M[]; today: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const kw = q.trim();
  const filtered = sel !== null ? members.filter((m) => m.id === sel) : kw ? members.filter((m) => m.name.includes(kw)) : members;
  const list = sortMembers(filtered, sort);

  return (
    <>
      <Alert className="mx-4 mt-4 w-auto border-0 bg-accent text-accent-foreground">
        <Info />
        <AlertDescription className="text-sm leading-relaxed break-keep text-accent-foreground">
          본인 인스타그램 ID를 추가하고 싶다면 운영진에게 알려주세요. 추가해드릴게요.
        </AlertDescription>
      </Alert>
      <div className="flex items-start gap-2 px-4 pt-4">
        <SortSelect value={sort} onChange={setSort} />
        <MemberCombobox options={members} selectedId={sel} onSelect={setSel} query={q} onQuery={setQ} />
      </div>
      <div className="mx-4.5 mt-3 mb-2 text-[13px] text-muted-foreground">크루원 {list.length}명</div>
      <ul className="mx-4 mb-8 divide-y overflow-hidden rounded-[10px] border bg-card">
        {list.map((m) => {
          const days = daysSince(m.joined_at, today);
          return (
            <li key={m.id} className="flex min-h-14 items-center gap-2.5 px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[15px] font-semibold">
                  {m.name}
                  {days <= NEW_DAYS && <Badge aria-label="신규 크루원" title="신규 크루원" className="size-[18px] justify-center rounded-[5px] p-0 text-[11px] font-semibold">N</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">가입한지 {days}일 ({m.joined_at})</div>
              </div>
              {m.instagram_id && (
                <a className="flex min-h-11 items-center gap-1 text-[13px] font-normal text-primary" href={`https://instagram.com/${m.instagram_id}`} target="_blank" rel="noopener noreferrer">
                  @{m.instagram_id} <ExternalLink className="size-3.5" />
                </a>
              )}
            </li>
          );
        })}
        {list.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">검색 결과가 없어요</li>}
      </ul>
    </>
  );
}
