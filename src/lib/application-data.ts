import "server-only";
import { db } from "./supabase";
import { missingTable } from "./tickets";

export type ApplicationStatus = "신규" | "가입완료" | "반려";
export type ApplicationRow = { id: number; name: string; instagram_id: string; created_at: string; status: ApplicationStatus };

/** 신청서 목록(최신순). 테이블이 아직 없으면(0016 마이그레이션 전) 빈 목록 + ready=false */
export async function loadApplications(): Promise<{ applications: ApplicationRow[]; ready: boolean }> {
  const { data, error } = await db().from("crew_applications").select("id,name,instagram_id,created_at,status").order("created_at", { ascending: false }).order("id", { ascending: false });
  if (error) {
    if (missingTable(error)) return { applications: [], ready: false };
    throw error;
  }
  return { applications: (data ?? []) as ApplicationRow[], ready: true };
}

export type ApplicationDetail = ApplicationRow & {
  birth_year: number;
  gender: string;
  experience: string;
  gym_area: string;
  bouldering_level: string;
  reason: string;
};

/** 신청서 1건 상세. 없으면 null */
export async function loadApplication(id: number): Promise<ApplicationDetail | null> {
  const { data, error } = await db().from("crew_applications").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (missingTable(error)) return null;
    throw error;
  }
  return (data as ApplicationDetail | null) ?? null;
}
