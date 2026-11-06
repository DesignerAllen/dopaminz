import { requireViewer } from "@/lib/guard";
import { db } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import InstagramForm from "@/components/InstagramForm";
import LogoutButton from "@/components/LogoutButton";
import { AssetText, ListHeader, ListRow } from "@/components/tds";

export const metadata = { title: "설정" };

// 설정: 내 인스타그램 ID · 비밀번호 변경(개인 로그인) · 로그아웃. 공통 로그인이면 로그아웃만 보인다.
export default async function SettingsPage() {
  const s = await requireViewer("/settings", { adminTo: "/admin" });
  let insta = "";
  if (s.mid) {
    const { data } = await db().from("members").select("instagram_id").eq("id", s.mid).maybeSingle();
    insta = (data as { instagram_id: string | null } | null)?.instagram_id ?? "";
  }
  return (
    <>
      <PageHeader title="설정" admin={false} back="/" />
      <main className="flex flex-1 flex-col bg-white">
        {s.mid && (
          <>
            <ListHeader title="내 정보" />
            <InstagramForm initial={insta} />
            <ListRow href="/account/password" left={<AssetText>🔑</AssetText>} bottom="비밀번호 변경" withArrow />
          </>
        )}
        <LogoutButton />
      </main>
    </>
  );
}
