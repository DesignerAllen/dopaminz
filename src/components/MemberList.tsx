"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Info } from "lucide-react";
import MemberCombobox from "./MemberCombobox";
import SortSelect from "./SortSelect";
import { Badge, press } from "./tds";
import { DEFAULT_SORT, sortMembers, type SortKey } from "@/lib/member-sort";

type M = { id: number; name: string; joined_at: string; instagram_id: string | null; mate: string | null };

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
      <div className="mx-4 mt-4 flex items-start gap-2 rounded-2xl bg-[#f2f4f6] px-4 py-3 text-[13px] leading-[19.5px] break-keep text-[#4e5968]">
        <Info className="mt-0.5 size-4 flex-none text-[#6b7684]" />
        <p>설정에서 내 인스타그램 ID를 등록하면 여기에 표시돼요.</p>
      </div>
      <div className="flex items-start gap-2 px-4 pt-4">
        <SortSelect value={sort} onChange={setSort} />
        <MemberCombobox options={members} selectedId={sel} onSelect={setSel} query={q} onQuery={setQ} />
      </div>
      <div className="px-6 pt-4 pb-1 text-[13px] leading-[19.5px] text-[#6b7684]">크루원 {list.length}명</div>
      <ul className="pb-6">
        {list.map((m) => {
          const days = daysSince(m.joined_at, today);
          const body = (
            <>
              <span className="flex flex-wrap items-center gap-1.5 text-[17px] leading-[25.5px] font-semibold text-[#191f28]">
                {m.name}
                {m.mate && <Badge size="small" color="elephant" variant="weak">{m.mate}</Badge>}
                {days <= NEW_DAYS && <Badge size="xsmall" color="red" variant="fill">N</Badge>}
              </span>
              <span className="block text-[13px] leading-[19.5px] text-[#6b7684]">가입한지 {days}일 ({m.joined_at})</span>
            </>
          );
          // 링크(<a>) 안에 링크를 넣을 수 없으므로, 클메이트 결과 링크와 인스타그램 링크를 나란히 둔다
          return (
            <li key={m.id} className="flex items-center gap-4 px-6 py-3">
              {m.mate ? (
                <Link href={`/climbmate/result/${m.id}?from=members`} className={`-mx-2 -my-1 min-w-0 flex-1 rounded-lg px-2 py-1 ${press}`}>{body}</Link>
              ) : (
                <span className="min-w-0 flex-1">{body}</span>
              )}
              {m.instagram_id && (
                <a className={`-mr-2 flex min-h-10 flex-none items-center gap-1 rounded-lg px-2 text-[13px] text-[#4e5968] ${press}`} href={`https://instagram.com/${m.instagram_id}`} target="_blank" rel="noopener noreferrer">
                  @{m.instagram_id} <ExternalLink className="size-3.5" />
                </a>
              )}
            </li>
          );
        })}
        {list.length === 0 && <li className="p-8 text-center text-[15px] text-[#6b7684]">검색 결과가 없어요</li>}
      </ul>
    </>
  );
}
