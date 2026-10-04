import { NextResponse } from "next/server";
import { clientIp, compare, loadSecrets, lockState, recordAttempt } from "@/lib/auth";
import { writeSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { pin?: unknown } | null;
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!/^\d{4}$/.test(pin)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const ip = await clientIp();
  const before = await lockState("viewer", ip);
  if (before.locked) return NextResponse.json({ ok: false, locked: true, retryAfterSec: before.retryAfterSec }, { status: 429 });

  const secrets = await loadSecrets();
  const ok = await compare(pin, secrets.viewer_pin_hash);
  await recordAttempt("viewer", ip, ok);

  if (ok) {
    await writeSession({ ver: secrets.session_version });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
