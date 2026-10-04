import { redirect } from "next/navigation";

export const metadata = { title: "관리자" };

// 관리자 모드의 첫 화면은 회비 관리
export default function AdminIndex() {
  redirect("/admin/payments");
}
