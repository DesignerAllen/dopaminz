import { NextResponse } from "next/server";
import { currentVersion } from "@/lib/guard";
import { hasAdminAuth, readSession, writeSession } from "@/lib/session";

/** [모드 종료] 뒤 다시 관리자로 들어올 때: 관리자 인증이 남아 있으면 비밀번호 없이 관리자 모드를 켠다.
 *  /admin/login 이 이리로 보낸다. 인증이 없으면 로그인 화면으로 돌려보낸다. */
// 상대 경로로 보낸다(개발 서버를 0.0.0.0 으로 띄우면 req.url 의 호스트가 브라우저에서 열 수 없는 주소가 된다)
const go = (path: string) => new NextResponse(null, { status: 307, headers: { Location: path } });

export async function GET() {
  const s = await readSession();
  if (!s || !hasAdminAuth(s) || (await currentVersion()) !== s.ver) {
    if (s && hasAdminAuth(s)) await writeSession({ ver: s.ver }); // 버전이 어긋난 옛 인증은 지워서 /admin/login ↔ 여기 무한 이동을 막는다
    return go(s ? "/admin/login" : "/login");
  }
  await writeSession({ ver: s.ver, admin: true });
  return go("/admin");
}
