"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KIND_LABEL, type Kind } from "@/lib/payment-rules";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Target = { memberId: number; name: string; ym: string };
type Ctx = {
  tap: (t: Target, kind: Kind) => void;
};
const PayCtx = createContext<Ctx | null>(null);

/** 관리자 모드에서 납부 체크를 처리한다. editable=false 이면 표시만 한다. */
export function PayEditorProvider({ editable, children }: { editable: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<Target | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useCallback(
    async (t: Target, action: "check" | "uncheck") => {
      setBusy(true);
      try {
        const res = await fetch("/api/admin/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: t.memberId, ym: t.ym, action }),
        });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) {
          toast.error("처리하지 못했어요. 다시 시도해 주세요");
          return;
        }
        toast.success(`${t.name} · ${t.ym} ${action === "uncheck" ? "납부 해제" : "납부 처리"}`);
        router.refresh();
      } catch {
        toast.error("네트워크 오류가 발생했어요");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const tap = useCallback(
    (t: Target, kind: Kind) => {
      if (busy) return;
      if (kind === "paid" || kind === "exception" || kind === "warn") setConfirm(t); // 해제 시에만 확인 팝업
      else if (kind === "unpaid" || kind === "upcoming") void send(t, "check");
    },
    [busy, send],
  );

  return (
    <PayCtx.Provider value={editable ? { tap } : null}>
      {children}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="max-w-[340px]">
          <AlertDialogHeader>
            <AlertDialogTitle>납부를 해제할까요?</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.name} · {confirm?.ym} 납부 기록이 삭제돼요.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2.5">
            <AlertDialogCancel className="flex-1">취소</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1"
              onClick={() => {
                const t = confirm;
                setConfirm(null);
                if (t) void send(t, "uncheck");
              }}
            >
              해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PayCtx.Provider>
  );
}

export function PayCell({ kind, memberId, name, ym }: { kind: Kind; memberId: number; name: string; ym: string }) {
  const ctx = useContext(PayCtx);
  const check = kind === "paid" || kind === "exception";
  const inner = (
    <>
      {check && (
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      )}
      <span>{kind === "paid" ? "" : KIND_LABEL[kind]}</span>
    </>
  );
  const label = `${name} ${ym} ${kind === "free" ? "가입달 면제" : KIND_LABEL[kind]}`;
  if (ctx && kind !== "na" && kind !== "free") { // 가입달(면제)은 누를 수 없다
    return (
      <button className={`cell editable ${kind}`} aria-label={label} onClick={() => ctx.tap({ memberId, name, ym }, kind)}>
        {inner}
      </button>
    );
  }
  return (
    <div className={`cell ${kind}`} role="img" aria-label={label}>
      {inner}
    </div>
  );
}
