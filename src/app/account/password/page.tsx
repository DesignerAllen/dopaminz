import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import ChangePin from "@/components/ChangePin";

export const metadata = { title: "비밀번호 변경" };

// 개인 로그인한 크루원만. 공통 로그인 상태면 로그인 화면(이름 검색)으로 보낸다
export default async function ChangePasswordPage() {
  const s = await requireViewer("/account/password", { adminTo: "/admin" });
  if (!s.mid) redirect("/");
  return (
    <>
      <PageHeader title="비밀번호 변경" admin={false} back="/" />
      <ChangePin />
    </>
  );
}
