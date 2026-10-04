import { NextResponse } from "next/server";
import { audit, bad, requireAdminApi } from "@/lib/admin-api";
import { validateMemberInput } from "@/lib/member-input";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return bad("invalid");
  const v = await validateMemberInput(b);
  if ("error" in v) return bad(v.error);
  if (v.warnings.length && b.force !== true) return bad("confirm", 409, { warnings: v.warnings });

  const { data, error } = await db().from("members").insert({ ...v.value, status: "회원" }).select("id").single();
  if (error) return bad("db", 500);
  await audit("member.create", { member_id: data.id, detail: v.value });
  return NextResponse.json({ ok: true, id: data.id });
}
