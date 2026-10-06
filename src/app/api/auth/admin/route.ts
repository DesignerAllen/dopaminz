import { NextResponse } from "next/server";
import { clientIp, compare, loadSecrets, lockState, recordAttempt } from "@/lib/auth";
import { readSession, writeSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || password.length > 200) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  // 관리자 모드는 뷰어 인증을 통과한 뒤에만 진입할 수 있다.
  const session = await readSession();
  const secrets = await loadSecrets();
  if (!session || session.ver !== secrets.session_version) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const ip = await clientIp();
  const before = await lockState("admin", ip);
  if (before.locked) return NextResponse.json({ ok: false, locked: true, retryAfterSec: before.retryAfterSec }, { status: 429 });

  const ok = await compare(password, secrets.admin_password_hash);
  await recordAttempt("admin", ip, ok);

  if (ok) {
    await writeSession({ ver: session.ver, admin: true });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
