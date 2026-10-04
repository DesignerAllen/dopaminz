"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KIND_LABEL, type Kind } from "@/lib/payment-rules";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

type Target = { memberId: number; name: string; ym: string };
type Ctx = {
  exceptionMode: boolean;
  setExceptionMode: (v: boolean) => void;
  tap: (t: Target, kind: Kind) => void;
};
const PayCtx = createContext<Ctx | null>(null);

/** 관리자 모드에서 납부 체크를 처리한다. editable=false 이면 표시만 한다. */
export function PayEditorProvider({ editable, children }: { editable: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [exceptionMode, setExceptionMode] = useState(false);
  const [confirm, setConfirm] = useState<Target | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useCallback(
    async (t: Target, action: "check" | "uncheck", exception = false) => {
      setBusy(true);
      try {
        const res = await fetch("/api/admin/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: t.memberId, ym: t.ym, action, exception }),
        });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) {
          toast.error("처리하지 못했어요. 다시 시도해 주세요");
          return;
        }
        toast.success(`${t.name} · ${t.ym} ${action === "uncheck" ? "납부 해제" : exception ? "예외 납부 처리" : "납부 처리"}`);
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
      else if (kind === "free") {
        if (exceptionMode) void send(t, "check", true);
        else toast('가입달은 면제예요. "예외 납부 모드"를 켜고 눌러 주세요');
      } else if (kind === "unpaid" || kind === "upcoming") void send(t, "check");
    },
    [busy, exceptionMode, send],
  );

  return (
    <PayCtx.Provider value={editable ? { exceptionMode, setExceptionMode, tap } : null}>
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

export function ExceptionToggle() {
  const ctx = useContext(PayCtx);
  if (!ctx) return null;
  return (
    <label className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-[#e4e6fb] px-3 py-2.5 text-[13px] font-semibold text-[#2e3190]">
      <Checkbox className="size-5" checked={ctx.exceptionMode} onCheckedChange={(v) => ctx.setExceptionMode(v === true)} />
      예외 납부 모드 — 켜고 가입달(-) 칸을 누르면 예외 납부로 기록
    </label>
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
  if (ctx && kind !== "na") {
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
