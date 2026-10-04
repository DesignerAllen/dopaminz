import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** 홈 메뉴 카드. href 가 없으면 준비 중(비활성) 상태. */
export default function MenuCard({ href, title, caption }: { href?: string; title: string; caption: string }) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted-foreground">{caption}</span>
      </span>
      <ChevronRight className={cn("size-5", href ? "text-primary" : "text-muted-foreground/60")} aria-hidden="true" />
    </>
  );
  const base = "flex min-h-[72px] items-center gap-3 rounded-[10px] border px-4 py-3.5 text-left";
  return href ? (
    <Link href={href} className={cn(base, "bg-card transition-colors active:bg-secondary")}>{body}</Link>
  ) : (
    <div aria-disabled="true" className={cn(base, "bg-muted")}>{body}</div>
  );
}
