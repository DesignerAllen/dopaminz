import { NextResponse } from "next/server";
import { judge } from "@/lib/climbmate";
import { db } from "@/lib/supabase";
import { requireViewerApi } from "@/lib/viewer-api";

const noLogin = () => NextResponse.json({ ok: false, error: "member_required" }, { status: 401 });

/** 테스트 결과 저장(재검사하면 최신 결과로 갱신). 판정은 서버에서 원응답으로 다시 계산한다. 저장된 결과는 곧바로 크루원 추천에 공개된다 */
export async function POST(req: Request) {
  const auth = await requireViewerApi();
  if ("error" in auth) return auth.error;
  const mid = auth.session.mid;
  if (!mid) return noLogin();

  const body = (await req.json().catch(() => null)) as { answers?: unknown } | null;
  const a = body?.answers;
  if (!Array.isArray(a) || a.length !== 12 || !a.every((v) => v === 0 || v === 1)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const { axes, typeKey } = judge(a as number[]);
  const { error } = await db()
    .from("climb_profiles")
    .upsert({ member_id: mid, axes, type_key: typeKey, answers: a, updated_at: new Date().toISOString() }, { onConflict: "member_id" });
  if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
