import { EyeOff } from "lucide-react";
import { formatDate, excerpt, type Notice } from "@/lib/notices";
import ShareBar from "./ShareBar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

/** 본문의 http(s) 링크만 눌러 열 수 있게 한다. 나머지는 줄바꿈을 유지한 글자 그대로. */
function Body({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/g);
  return (
    <div className="text-[15px] leading-[1.7] wrap-anywhere whitespace-pre-wrap">
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-primary underline">{p}</a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </div>
  );
}

/** 공지 상세 본문(제목·작성일·수정일·내용). 링크 복사·공유 버튼은 관리자 화면(showShare)에서만 나온다. */
export default function NoticeArticle({ n, showShare = false }: { n: Notice; showShare?: boolean }) {
  return (
    <>
      {n.status === "미노출" && (
        <Alert className="mx-4 mt-3 w-auto border-amber-300 bg-amber-100 text-amber-950">
          <EyeOff />
          <AlertDescription className="text-amber-950">미노출 상태예요. 크루원에게는 보이지 않아요.</AlertDescription>
        </Alert>
      )}
      <article className="px-4 pt-5 pb-4">
        <h2 className="text-xl leading-snug font-semibold break-keep">{n.title}</h2>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <span>작성일 {formatDate(n.created_at)}</span>
          {n.updated_at && <span>수정일 {formatDate(n.updated_at)}</span>}
        </div>
        <Separator className="my-4" />
        <Body text={n.content} />
        {showShare && <ShareBar title={n.title} text={excerpt(n.content, 100)} path={`/notices/${n.id}`} />}
      </article>
    </>
  );
}
