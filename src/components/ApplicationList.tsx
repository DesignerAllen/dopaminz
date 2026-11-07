import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { STATUS_STYLE } from "@/lib/applications";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Item = { id: number; name: string; instagram: string; date: string; status: "신규" | "가입완료" | "반려" };
// 열 너비를 고정해 머리글과 모든 행의 열이 같은 위치에 오게 한다
const COLS = "grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1.3fr)_4.75rem]";

/** 관리자: 크루 가입 신청서 목록 (상태 / 이름 / 인스타 ID / 신청일) */
export default function ApplicationList({ items, ready }: { items: Item[]; ready: boolean }) {
  return (
    <div className="px-4 pt-3 pb-10">
      {!ready && (
        <Alert className="mb-3 border-0 bg-[#fff9e7] text-[#191f28]">
          <TriangleAlert />
          <AlertDescription className="text-[#191f28]">신청서 저장소가 아직 없어요. Supabase에서 <b>0016_crew_applications.sql</b>을 실행해 주세요.</AlertDescription>
        </Alert>
      )}
      <h2 className="mb-2 px-0.5 text-base font-semibold">신청서 <span className="text-sm font-normal text-muted-foreground">{items.length}건</span></h2>
      <ul className="-mx-4">
        <li className={`grid ${COLS} gap-2 px-6 pb-1 text-xs text-muted-foreground`} aria-hidden="true">
          <span>상태</span><span>이름</span><span>인스타 ID</span><span>신청일</span>
        </li>
        {items.map((a) => (
          <li key={a.id} className="relative after:absolute after:right-0 after:bottom-0 after:left-6 after:h-px after:bg-[#f2f4f6] last:after:hidden">
            <Link href={`/admin/applications/${a.id}`} className={`grid ${COLS} items-center gap-2 px-6 py-4 text-[15px] active:bg-[#f2f4f6]`}>
              <span className={`w-fit rounded-lg px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[a.status]}`}>{a.status}</span>
              <span className={`min-w-0 truncate font-semibold ${a.status === "반려" ? "text-[#b0b8c1]" : ""}`}>{a.name}</span>
              <span className={`min-w-0 truncate ${a.status === "반려" ? "text-[#b0b8c1]" : ""}`}>@{a.instagram}</span>
              <span className="text-xs text-muted-foreground">{a.date}</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">접수된 신청서가 없어요</li>}
      </ul>
    </div>
  );
}
