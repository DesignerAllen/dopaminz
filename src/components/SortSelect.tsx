"use client";

import { ArrowUpDown } from "lucide-react";
import { SORT_OPTIONS, type SortKey } from "@/lib/member-sort";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** 글자 앞에 정렬 아이콘이 붙은 정렬 선택(shadcn Select). */
export default function SortSelect({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger aria-label="정렬" className="w-35 flex-none justify-start gap-1.5 px-2.5 text-sm font-normal [&>svg:last-child]:hidden">
        <ArrowUpDown className="size-4.5 text-foreground/70" aria-hidden="true" />
        <SelectValue>{SORT_OPTIONS.find((o) => o.key === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
