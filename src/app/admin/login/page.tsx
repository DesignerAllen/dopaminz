import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/guard";
import { hasAdminAuth, isAdmin } from "@/lib/session";
import AdminLoginForm from "@/components/AdminLoginForm";


export default async function AdminLoginPage() {
  const session = await requireViewer();
  if (isAdmin(session)) redirect("/admin");
  // [모드 종료]만 했던 경우: 관리자 인증이 남아 있으므로 비밀번호 없이 다시 켠다(쿠키는 route handler 에서만 쓸 수 있다)
  if (hasAdminAuth(session)) redirect("/api/auth/admin/resume");
  return <AdminLoginForm />;
}
