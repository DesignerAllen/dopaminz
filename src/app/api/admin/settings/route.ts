import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { writeSession } from "@/lib/session";
import { db } from "@/lib/supabase";

const policy = (p: string) => p.length >= 8 && p.length <= 100 && /[A-Za-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return bad("invalid");
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");

  const { data: cur } = await db().from("settings").select("*").eq("id", 1).single();
  if (!cur) return bad("settings_missing", 500);
  const now = new Date().toISOString();

  // 계좌 설정: 크루 운영 계좌(크루권·회비·기타 입금 공통)
  if (b.kind === "account") {
    const account = str("account").trim();
    if (!account) return bad("계좌번호를 입력해 주세요");
    if (account.length > 100) return bad("입력이 너무 길어요");
    const { error } = await db().from("settings").update({ notice_account: account, updated_at: now }).eq("id", 1);
    if (error) return bad("저장하지 못했어요", 500);
    await audit("settings.account");
    return NextResponse.json({ ok: true });
  }

  // 회비 설정: 월 회비·납부일
  if (b.kind === "fee") {
    const fee = str("fee").trim(), due = str("due").trim();
    if (!fee) return bad("월 회비를 입력해 주세요");
    if (fee.length > 60 || due.length > 60) return bad("입력이 너무 길어요");
    const patch: Record<string, string> = { notice_fee: fee, updated_at: now };
    if ("notice_due" in cur) patch.notice_due = due; // 0002 마이그레이션 적용 후에만 저장
    const { error } = await db().from("settings").update(patch).eq("id", 1);
    if (error) return bad("저장하지 못했어요", 500);
    await audit("settings.fee");
    return NextResponse.json({ ok: true });
  }

  if (b.kind === "notice") {
    const fee = str("fee").trim(), account = str("account").trim(), due = str("due").trim();
    if (!fee || !account) return bad("회비 금액과 계좌번호를 모두 입력해 주세요");
    if (fee.length > 60 || account.length > 100 || due.length > 60) return bad("입력이 너무 길어요");
    const patch: Record<string, string> = { notice_fee: fee, notice_account: account, updated_at: now };
    if ("notice_due" in cur) patch.notice_due = due; // 0002 마이그레이션 적용 후에만 저장
    const { error } = await db().from("settings").update(patch).eq("id", 1);
    if (error) return bad("저장하지 못했어요", 500);
    await audit("settings.notice");
    return NextResponse.json({ ok: true });
  }

  if (b.kind === "viewerPin") {
    const pin = str("pin");
    if (!/^\d{4}$/.test(pin)) return bad("숫자 4자리를 입력해 주세요");
    if (await bcrypt.compare(pin, cur.admin_password_hash)) return bad("관리자 비밀번호와 같을 수 없어요");
    // 별도 확인 없이 즉시 적용. 기존 뷰어 세션은 무효화하고, 현재 관리자 세션만 새 버전으로 유지한다.
    const ver = cur.session_version + 1;
    const patch = { viewer_pin_hash: await bcrypt.hash(pin, 12), session_version: ver, updated_at: now };
    // viewer_pin_display: 관리자 화면에 현재 비밀번호를 보여주기 위한 표시 전용 값(0007 적용 전에는 건너뜀)
    let { error } = await db().from("settings").update({ ...patch, viewer_pin_display: pin }).eq("id", 1);
    if (error?.code === "42703" || error?.code === "PGRST204") ({ error } = await db().from("settings").update(patch).eq("id", 1));
    if (error) return bad("저장하지 못했어요", 500);
    await writeSession({ ver, adminUntil: auth.session.adminUntil });
    await audit("settings.viewerPin");
    return NextResponse.json({ ok: true });
  }

  if (b.kind === "adminPw") {
    const oldPw = str("oldPassword"), next = str("newPassword"), confirm = str("confirm");
    if (!(await bcrypt.compare(oldPw, cur.admin_password_hash))) return bad("기존 비밀번호가 맞지 않아요");
    if (!policy(next)) return bad("영문·숫자·특수기호를 모두 포함해 8자 이상으로 입력해 주세요");
    if (await bcrypt.compare(next, cur.viewer_pin_hash)) return bad("뷰어 비밀번호와 같을 수 없어요");
    if (next !== confirm) return bad("신규 비밀번호 확인이 일치하지 않아요");
    await db().from("settings").update({ admin_password_hash: await bcrypt.hash(next, 12), updated_at: now }).eq("id", 1);
    await audit("settings.adminPassword");
    return NextResponse.json({ ok: true });
  }
  return bad("invalid");
}
