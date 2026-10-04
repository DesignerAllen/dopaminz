import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/guard";
import { isAdmin } from "@/lib/session";
import AdminLoginForm from "@/components/AdminLoginForm";

export default async function AdminLoginPage() {
  const session = await requireViewer();
  if (isAdmin(session)) redirect("/admin");
  return <AdminLoginForm />;
}
