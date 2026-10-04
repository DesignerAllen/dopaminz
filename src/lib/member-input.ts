import "server-only";
import { db } from "./supabase";
import { todayKst } from "./payment-rules";

export type MemberInput = { name: string; joined_at: string; instagram_id: string | null };

/** 기획안 3장 입력 규칙 검증. 오류는 error, 동명이인·미래 가입일은 warnings(확인 후 진행 가능). */
export async function validateMemberInput(
  raw: { name?: unknown; joined_at?: unknown; instagram_id?: unknown },
  selfId?: number,
): Promise<{ error: string } | { value: MemberInput; warnings: string[] }> {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) return { error: "이름을 입력해 주세요" };
  if (name.length > 50) return { error: "이름은 50자 이내로 입력해 주세요" };

  const joined = typeof raw.joined_at === "string" ? raw.joined_at : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joined) || Number.isNaN(Date.parse(joined))) return { error: "가입일을 선택해 주세요" };

  let insta: string | null = typeof raw.instagram_id === "string" ? raw.instagram_id.trim().replace(/^@+/, "") : "";
  if (insta === "") insta = null;
  if (insta && !/^[A-Za-z0-9._]{1,30}$/.test(insta)) return { error: "인스타그램 ID는 영문·숫자·마침표·밑줄 30자 이내만 가능해요" };

  const warnings: string[] = [];
  let q = db().from("members").select("id", { count: "exact", head: true }).eq("name", name);
  if (selfId) q = q.neq("id", selfId);
  const { count } = await q;
  if ((count ?? 0) > 0) warnings.push("같은 이름의 회원이 이미 있어요. 동명이인이 맞나요?");
  if (joined > todayKst()) warnings.push("가입일이 오늘 이후예요.");

  return { value: { name, joined_at: joined, instagram_id: insta }, warnings };
}
