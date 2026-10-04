"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketCatalogManager from "./TicketCatalogManager";
import type { TicketCenter } from "@/lib/tickets";
import type { PassView } from "./TicketCatalogManager";

async function post(body: unknown): Promise<{ status: number; ok: boolean; error?: string }> {
  const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { status: res.status, ok: res.ok, error: data.error };
}

const cardCls = "gap-0 rounded-[10px] py-4";

/** 설정 화면: [계좌 설정] 탭(계좌번호 · 회비 · 크루권)과 [비밀번호] 탭 */
export default function SettingsForms({ fee, account, due, viewerPin, centers, ticketsReady, passes }: { fee: string; account: string; due: string; viewerPin: string | null; centers: TicketCenter[]; ticketsReady: boolean; passes: PassView[] }) {
  const router = useRouter();
  const [a, setA] = useState(account);
  const [f, setF] = useState(fee);
  const [d, setD] = useState(due);
  const [pin, setPin] = useState(viewerPin ?? ""); // 현재 뷰어 비밀번호를 그대로 보여주고, 고쳐서 저장하면 덮어쓴다
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  async function run(body: unknown, okText: string, after?: () => void) {
    const r = await post(body);
    if (r.status === 401) return router.replace("/admin/login");
    if (r.ok) {
      toast.success(okText);
      after?.();
      router.refresh();
    } else toast.error(r.error ?? "저장하지 못했어요");
  }

  return (
    <Tabs defaultValue="account" className="px-4 pt-3 pb-10">
      <TabsList className="h-11 w-full">
        <TabsTrigger value="account" className="h-full text-sm data-active:font-semibold">계좌 설정</TabsTrigger>
        <TabsTrigger value="tickets" className="h-full text-sm data-active:font-semibold">크루권</TabsTrigger>
        <TabsTrigger value="password" className="h-full text-sm data-active:font-semibold">비밀번호</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="flex flex-col gap-3.5">
        <Card className={cardCls}>
          <CardHeader className="px-4">
            <CardTitle className="text-base">계좌번호</CardTitle>
            <CardDescription>크루 운영 계좌를 통합해서 사용해요. 크루권, 회비, 기타 비용 입금 시 공통으로 안내돼요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 pt-3">
            <div className="grid gap-1.5"><Label htmlFor="s-acc">은행명·계좌번호</Label><Input id="s-acc" value={a} onChange={(e) => setA(e.target.value)} placeholder="예) 79423663893 카카오뱅크" /></div>
            <Button className="w-full" onClick={() => run({ kind: "account", account: a }, "계좌번호를 저장했어요")}>계좌번호 저장</Button>
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardHeader className="px-4">
            <CardTitle className="text-base">회비</CardTitle>
            <CardDescription>회비 납부 현황 상단에 안내돼요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 pt-3">
            <div className="grid gap-1.5"><Label htmlFor="s-fee">월 회비 (예: 2,000원)</Label><Input id="s-fee" value={f} onChange={(e) => setF(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="s-due">납부일</Label><Input id="s-due" value={d} onChange={(e) => setD(e.target.value)} placeholder="예) 매월 1일" /></div>
            <Button className="w-full" onClick={() => run({ kind: "fee", fee: f, due: d }, "회비 설정을 저장했어요")}>회비 저장</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tickets">
        <TicketCatalogManager centers={centers} ready={ticketsReady} passes={passes} />
      </TabsContent>

      <TabsContent value="password" className="flex flex-col gap-3.5">
        <Card className={cardCls}>
          <CardHeader className="px-4">
            <CardTitle className="text-base">뷰어 비밀번호 설정</CardTitle>
            <CardDescription>숫자 4자리 · 저장 즉시 적용돼요 (이미 로그인한 회원은 다시 입력해야 해요)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 pt-3">
            <div className="grid gap-1.5">
              <Label htmlFor="s-pin">뷰어 비밀번호 {viewerPin ? "(현재 값)" : ""}</Label>
              <Input id="s-pin" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="0000" />
              {!viewerPin && <p className="text-xs text-muted-foreground">현재 비밀번호는 저장돼 있지 않아 표시되지 않아요. 새로 저장하면 이후부터 보여요.</p>}
            </div>
            <Button className="w-full" onClick={() => run({ kind: "viewerPin", pin }, "뷰어 비밀번호를 변경했어요")}>뷰어 비밀번호 저장</Button>
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardHeader className="px-4">
            <CardTitle className="text-base">관리자 비밀번호 변경</CardTitle>
            <CardDescription>영문·숫자·특수기호 포함 8자 이상 · 뷰어 비밀번호와 달라야 해요</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 pt-3">
            <div className="grid gap-1.5"><Label htmlFor="s-old">기존 비밀번호</Label><Input id="s-old" type="password" autoComplete="off" value={oldPw} onChange={(e) => setOldPw(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="s-new">신규 비밀번호</Label><Input id="s-new" type="password" autoComplete="off" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="s-new2">신규 비밀번호 확인</Label><Input id="s-new2" type="password" autoComplete="off" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} /></div>
            <Button className="w-full" onClick={() => run({ kind: "adminPw", oldPassword: oldPw, newPassword: newPw, confirm: newPw2 }, "관리자 비밀번호를 변경했어요", () => { setOldPw(""); setNewPw(""); setNewPw2(""); })}>관리자 비밀번호 변경</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
