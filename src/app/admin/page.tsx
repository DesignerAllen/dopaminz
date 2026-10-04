import { redirect } from "next/navigation";

// 관리자 모드의 첫 화면은 회비 관리
export default function AdminIndex() {
  redirect("/admin/payments");
}
