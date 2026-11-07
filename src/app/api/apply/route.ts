import { NextResponse } from "next/server";
import { parseApplication } from "@/lib/applications";
import { db } from "@/lib/supabase";
import { notifyTelegram } from "@/lib/telegram";

// 로그인 없이 누구나 제출하는 공개 API. 입력 검증은 서버에서 다시 한다.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  // 봇이 채우는 숨김 칸: 값이 있으면 성공한 척하고 저장하지 않는다
  if (body && typeof body.website === "string" && body.website !== "") return NextResponse.json({ ok: true });
  const v = parseApplication(body);
  if ("error" in v) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  const { data, error } = await db().from("crew_applications").insert(v.value).select("id").single();
  if (error || !data) return NextResponse.json({ ok: false, error: "제출하지 못했어요. 잠시 후 다시 시도해 주세요" }, { status: 500 });
  const base = (process.env.SITE_URL ?? "").replace(/\/$/, "");
  await notifyTelegram(`🧗 도파민즈 크루 가입 신청\n${v.value.name} (@${v.value.instagram_id}) · ${v.value.experience}\n${base}/admin/applications/${data.id}`);
  return NextResponse.json({ ok: true });
}
