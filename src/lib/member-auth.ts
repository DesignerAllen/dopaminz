import "server-only";
import { db } from "./supabase";

export type LoginMember = { id: number; name: string; hasPin: boolean };

/** 로그인·등록 화면의 크루원 검색 목록. 비밀번호 해시는 내보내지 않고 등록 여부만 알린다.
 *  select("*"): 0014 마이그레이션(pin_hash) 적용 전에도 로그인 화면이 깨지지 않도록 컬럼을 이름으로 고르지 않는다 */
export async function loadLoginMembers(): Promise<LoginMember[]> {
  const { data, error } = await db().from("members").select("*").eq("status", "회원").order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as { id: number; name: string; pin_hash?: string | null }[]).map((m) => ({ id: m.id, name: m.name, hasPin: !!m.pin_hash }));
}

export async function loadMemberName(id: number): Promise<string | null> {
  const { data } = await db().from("members").select("name").eq("id", id).eq("status", "회원").maybeSingle();
  return (data as { name: string } | null)?.name ?? null;
}
