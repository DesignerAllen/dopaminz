import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { isUuid, parseNotice, writeWithColumnFallback } from "@/lib/notices";
import { db } from "@/lib/supabase";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const id = (await ctx.params).id;
  if (!isUuid(id)) return bad("invalid");
  const v = parseNotice((await req.json().catch(() => null)) as Record<string, unknown> | null);
  if ("error" in v) return bad(v.error);
  // 수정일은 수정할 때만 기록된다(작성 직후에는 null)
  const now = new Date().toISOString();
  const { data, error } = await writeWithColumnFallback<{ id: string }>({ ...v, updated_at: now }, (p) => db().from("announcements").update(p).eq("id", id).select("id").maybeSingle());
  if (error) return bad("db", 500);
  if (!data) return bad("not_found", 404);
  await audit("notice.update", { detail: { id, title: v.title, status: v.status, pinned: v.pinned } });
  return NextResponse.json({ ok: true });
}
