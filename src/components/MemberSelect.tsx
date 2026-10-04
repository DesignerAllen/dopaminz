"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberCombobox from "./MemberCombobox";

/** 인원별 화면의 회원 선택: 검색 + 선택. X 는 기본 회원(첫 번째)으로 되돌린다. */
export default function MemberSelect({ members, value, basePath = "/status/person" }: { members: { id: number; name: string }[]; value: number; basePath?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <div className="flex px-4 pt-3">
      <MemberCombobox
        options={members}
        selectedId={value}
        query={q}
        onQuery={setQ}
        label="회원 선택"
        onSelect={(id) => router.push(id ? `${basePath}?m=${id}` : basePath)}
      />
    </div>
  );
}
