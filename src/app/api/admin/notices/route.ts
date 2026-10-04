import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { parseNotice, writeWithColumnFallback } from "@/lib/notices";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const v = parseNotice((await req.json().catch(() => null)) as Record<string, unknown> | null);
  if ("error" in v) return bad(v.error);
  const { data, error } = await writeWithColumnFallback<{ id: string }>(v, (p) => db().from("announcements").insert(p).select("id").single());
  if (error || !data) return bad(error?.code === "42P01" || error?.code === "PGRST205" ? "공지사항 테이블이 없어요. 마이그레이션(0004)을 먼저 실행해 주세요" : "db", 500);
  await audit("notice.create", { detail: { id: data.id, title: v.title, status: v.status, pinned: v.pinned } });
  return NextResponse.json({ ok: true, id: data.id });
}
