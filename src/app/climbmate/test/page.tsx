import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import ClimbTest from "@/components/ClimbTest";

export const metadata = { title: "클라이밍 성향 테스트" };

// 결과를 크루원 개인에게 저장하므로 개인 로그인(또는 최초 등록)을 거쳐야 한다
export default async function ClimbTestPage() {
  const s = await requireViewer("/climbmate/test", { adminTo: "/admin" });
  if (!s.mid) redirect("/climbmate/start");
  return (
    <>
      <PageHeader title="성향 테스트" admin={false} back="/" />
      <ClimbTest />
    </>
  );
}
