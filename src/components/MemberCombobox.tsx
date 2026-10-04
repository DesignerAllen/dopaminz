"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { InputGroupButton } from "@/components/ui/input-group";

export type Opt = { id: number; name: string };

/** 검색 + 선택을 한 번에 하는 콤보박스(shadcn Command 기반). 입력하면 후보가 걸러지고, 후보를 고르면 그 인원이 선택된다.
 *  오른쪽 X 버튼은 입력과 선택을 모두 초기화하고 포커스를 해제한다. */
export default function MemberCombobox({
  options, selectedId, onSelect, query, onQuery, label = "인원 검색", placeholder = "이름 검색",
}: {
  options: Opt[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  query: string;
  onQuery: (q: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === selectedId) ?? null;
  const text = selected ? selected.name : query;
  const shown = useMemo(() => {
    const q = (selected ? "" : query).trim();
    return q ? options.filter((o) => o.name.includes(q)) : options;
  }, [options, query, selected]);

  function pick(o: Opt) {
    onSelect(o.id);
    onQuery("");
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
  }
  function clear() {
    onSelect(null);
    onQuery("");
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  return (
    <div
      ref={root}
      className="relative z-(--z-search) min-w-0 flex-1"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Command shouldFilter={false} loop className="h-auto overflow-visible rounded-none bg-transparent p-0">
        <CommandInput
          aria-label={label}
          placeholder={placeholder}
          value={text}
          onFocus={() => setOpen(true)}
          onValueChange={(v) => {
            if (selected) onSelect(null); // 고친 순간 선택은 풀린다
            onQuery(v);
            setOpen(true);
          }}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          wrapperClassName="p-0"
          groupClassName="h-11! rounded-[10px]! border-input bg-white px-0 text-base"
          className="text-base"
          trailing={
            (text || selected) ? (
              <InputGroupButton variant="ghost" size="icon-sm" aria-label="검색 초기화" onClick={clear} className="mr-1">
                <X />
              </InputGroupButton>
            ) : null
          }
        />
        {open && (
          <CommandList className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 rounded-[10px] bg-popover p-1 shadow-md ring-1 ring-foreground/10">
            <CommandEmpty>검색 결과가 없어요</CommandEmpty>
            <CommandGroup className="p-0">
              {shown.map((o) => (
                <CommandItem
                  key={o.id}
                  value={String(o.id)}
                  data-checked={o.id === selectedId}
                  onSelect={() => pick(o)}
                  className="min-h-11 px-3 text-[15px] data-[checked=true]:font-semibold data-[checked=true]:text-primary"
                >
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
}
