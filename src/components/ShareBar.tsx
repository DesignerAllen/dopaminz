"use client";

import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

/** 공지 링크 복사 / 공유하기. 공유 시트(navigator.share)가 없는 환경에서는 링크를 복사한다. */
/** path: 공유할 크루원용 주소(예: /notices/<id>). 관리자 화면에서 눌러도 크루원 링크가 복사·공유된다. */
export default function ShareBar({ title, text, path }: { title: string; text: string; path: string }) {
  const link = () => `${window.location.origin}${path}`;
  async function copy() {
    if (await copyText(link())) toast.success("링크를 복사했어요!");
    else toast.error("복사하지 못했어요");
  }
  async function share() {
    const url = link();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as DOMException).name === "AbortError") return; // 사용자가 닫음
      }
    }
    if (await copyText(url)) toast.success("링크를 복사했어요!");
    else toast.error("복사하지 못했어요");
  }

  return (
    <div className="mt-6 flex gap-2">
      <Button variant="outline" className="flex-1" onClick={copy}><Link2 /> 링크 복사</Button>
      <Button className="flex-1" onClick={share}><Share2 /> 공유하기</Button>
    </div>
  );
}
