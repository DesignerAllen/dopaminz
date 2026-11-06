import Link from "next/link";
import { redirect } from "next/navigation";
import { loadMemberName } from "@/lib/member-auth";
import { requireViewer } from "@/lib/guard";
import { loadCrewProfiles, loadProfile } from "@/lib/climb-data";
import { findType, namesByType } from "@/lib/climbmate";
import PageHeader from "@/components/PageHeader";
import ClimbResult from "@/components/ClimbResult";
import ShareResultButton from "@/components/ShareResultButton";
import { Button } from "@/components/ui/button";

export const metadata = { title: "내 클메이트" };

export default async function ClimbMePage() {
  const s = await requireViewer("/climbmate/me", { adminTo: "/admin" });
  if (!s.mid) redirect("/climbmate/start");
  const me = await loadProfile(s.mid);
  if (!me) redirect("/climbmate/test");
  const [crew, name] = await Promise.all([loadCrewProfiles(), loadMemberName(s.mid)]);

  return (
    <>
      <PageHeader title="내 클메이트" admin={false} back="/" />
      <main className="flex flex-1 flex-col gap-6 px-5 pt-3 pb-7">
        <ClimbResult axes={me.axes} owner={name} crewNames={namesByType(crew, me.member_id)} />
        <div>
          <ShareResultButton title={`${name ? `${name}님은` : "나는"} ${findType(me.type_key)?.alias}`} path={`/climbmate/result/${me.member_id}`} />
          <Button asChild variant="outline" className="mt-2 h-12 w-full text-base"><Link href="/climbmate/test">다시 검사하기</Link></Button>
        </div>
      </main>
    </>
  );
}
