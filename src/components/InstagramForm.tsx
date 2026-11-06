"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { tdsButton } from "./tds";
import { cn } from "@/lib/utils";

/** 설정: 내 인스타그램 ID. 저장하면 기존 값을 덮어쓰고, 비우고 저장하면 삭제된다 */
export default function InstagramForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const dirty = value.trim().replace(/^@+/, "") !== saved;

  async function save() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/account/instagram", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_id: value }) });
      const data = (await res.json().catch(() => ({}))) as { instagram_id?: string | null; error?: string };
      if (!res.ok) return setErr(data.error && data.error.length < 40 && res.status === 400 ? data.error : "저장하지 못했어요. 잠시 후 다시 시도해 주세요");
      const next = data.instagram_id ?? "";
      setValue(next);
      setSaved(next);
      toast.success(next ? "인스타그램 ID를 저장했어요" : "인스타그램 ID를 삭제했어요");
      router.refresh();
    } catch {
      setErr("네트워크 오류가 발생했어요");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-6 pb-4">
      <label htmlFor="insta" className="text-[13px] leading-[19.5px] text-[#6b7684]">인스타그램 ID</label>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl bg-[#f2f4f6] px-4 focus-within:ring-2 focus-within:ring-[#333d4b]">
          <span className="text-[17px] text-[#8b95a1]">@</span>
          <input
            id="insta"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/^@+/, ""))}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="아이디 입력"
            className="min-w-0 flex-1 bg-transparent pl-0.5 text-[17px] text-[#191f28] outline-none placeholder:text-[#b0b8c1]"
          />
        </div>
        <button type="button" onClick={save} disabled={busy || !dirty} className={cn(tdsButton("fill"), "h-12 flex-none px-4 text-[15px] disabled:opacity-40")}>
          저장
        </button>
      </div>
      <p className="mt-1.5 min-h-[19.5px] text-[13px] leading-[19.5px] text-[#f04452]" role="status">{err}</p>
    </div>
  );
}
