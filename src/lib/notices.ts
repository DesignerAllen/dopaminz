import "server-only";
import { db } from "./supabase";

export type NoticeStatus = "노출" | "미노출";
export type Notice = { id: string; title: string; content: string; created_at: string; updated_at: string | null; status: NoticeStatus; pinned: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

/** 테이블이 아직 없으면(0004 마이그레이션 전) 빈 목록으로 취급한다 */
const missingTable = (e: { code?: string } | null) => e?.code === "42P01" || e?.code === "PGRST205";

/** status 컬럼(0005 마이그레이션) 적용 전에는 모든 공지를 '노출'로 본다 */
const normalize = (row: Record<string, unknown>): Notice => ({ ...(row as Omit<Notice, "status" | "pinned">), status: row.status === "미노출" ? "미노출" : "노출", pinned: row.pinned === true });

/** 뷰어는 '노출' 공지만, 관리자(includeHidden)는 전부 */
export async function loadNotices(includeHidden = false): Promise<{ notices: Notice[]; ready: boolean }> {
  const { data, error } = await db().from("announcements").select("*").order("created_at", { ascending: false });
  if (error) {
    if (missingTable(error)) return { notices: [], ready: false };
    throw error;
  }
  // 고정 공지가 위로, 그 안과 나머지는 작성일 최신순(조회 순서가 이미 최신순이고 sort 는 안정 정렬)
  const all = ((data ?? []) as Record<string, unknown>[]).map(normalize).sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return { notices: includeHidden ? all : all.filter((n) => n.status === "노출"), ready: true };
}

/** 미노출 공지도 돌려준다. 보여줄지는 호출한 쪽(관리자 여부)이 정한다. */
export async function loadNotice(id: string): Promise<Notice | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await db().from("announcements").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (missingTable(error)) return null;
    throw error;
  }
  return data ? normalize(data as Record<string, unknown>) : null;
}

/** 한국 시간 기준 날짜(YYYY.MM.DD) */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(iso)).replaceAll("-", ".");
}

/** 미리보기·메타 태그용 요약: 공백을 정리하고 길면 … 로 줄인다 */
export function excerpt(content: string, max = 100): string {
  const t = content.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** 관리자 입력 검증 */
export function parseNotice(b: Record<string, unknown> | null): { title: string; content: string; status: NoticeStatus; pinned: boolean } | { error: string } {
  const title = typeof b?.title === "string" ? b.title.trim() : "";
  const content = typeof b?.content === "string" ? b.content.trim() : "";
  if (!title) return { error: "제목을 입력해 주세요" };
  if (title.length > 100) return { error: "제목은 100자 이내로 입력해 주세요" };
  if (!content) return { error: "내용을 입력해 주세요" };
  if (content.length > 5000) return { error: "내용은 5,000자 이내로 입력해 주세요" };
  const status: NoticeStatus = b?.status === "미노출" ? "미노출" : "노출";
  return { title, content, status, pinned: b?.pinned === true };
}


/** 새 컬럼(status, pinned)의 마이그레이션이 아직 없는 DB 에서도 저장되도록, 없다고 알려준 컬럼만 빼고 다시 시도한다 */
export async function writeWithColumnFallback<T>(payload: Record<string, unknown>, run: (p: Record<string, unknown>) => PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>) {
  let p = { ...payload };
  for (let i = 0; i < 3; i++) {
    const r = await run(p);
    const missing = r.error && (r.error.code === "42703" || r.error.code === "PGRST204") ? /'(\w+)' column|column "?(\w+)"?/.exec(r.error.message ?? "") : null;
    const col = missing?.[1] ?? missing?.[2];
    if (!col || !(col in p)) return r;
    delete p[col];
  }
  return run(p);
}
