"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

/** [클메이트에게 공유]: 공유 시트(navigator.share)를 열고, 없는 환경에서는 링크를 복사한다 */
/** 공유 시트에는 title 과 url 만 넘긴다. text 를 같이 넘기면 메신저가 "문구 + 주소"를 한 줄로 이어 붙여 문구까지 주소로 인식해 링크가 깨진다. 미리보기는 페이지의 OG 제목·설명이 맡는다 */
export default function ShareResultButton({ title, path }: { title: string; path: string }) {
  async function share() {
    const url = `${window.location.origin}${path}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if ((e as DOMException).name === "AbortError") return;
      }
    }
    if (await copyText(url)) toast.success("링크를 복사했어요!");
    else toast.error("복사하지 못했어요");
  }
  return <Button className="h-12 w-full text-base" onClick={share}><Share2 data-icon="inline-start" />클메이트에게 공유</Button>;
}
