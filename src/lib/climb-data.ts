import "server-only";
import { db } from "./supabase";

export type ClimbProfile = { member_id: number; axes: number[]; type_key: string; updated_at: string };

export async function loadProfile(memberId: number): Promise<ClimbProfile | null> {
  const { data, error } = await db().from("climb_profiles").select("member_id, axes, type_key, updated_at").eq("member_id", memberId).maybeSingle();
  if (error) throw error;
  return (data as ClimbProfile | null) ?? null;
}

export type CrewProfile = ClimbProfile & { name: string };

/** 저장된 결과 전체(회원 상태만). 결과는 저장과 동시에 크루원에게 공개된다 */
export async function loadCrewProfiles(): Promise<CrewProfile[]> {
  const { data, error } = await db()
    .from("climb_profiles")
    .select("member_id, axes, type_key, updated_at, members!inner(name, status)")
    .eq("members.status", "회원");
  if (error) throw error;
  return ((data ?? []) as unknown as (ClimbProfile & { members: { name: string } })[]).map((r) => ({
    member_id: r.member_id, axes: r.axes, type_key: r.type_key, updated_at: r.updated_at, name: r.members.name,
  }));
}

/** 크루원별 저장된 유형 키(member_id → type_key). 관리자 회원 목록의 태그용 */
export async function loadTypeKeys(): Promise<Map<number, string>> {
  const { data, error } = await db().from("climb_profiles").select("member_id, type_key");
  if (error) throw error;
  return new Map(((data ?? []) as { member_id: number; type_key: string }[]).map((r) => [r.member_id, r.type_key]));
}
