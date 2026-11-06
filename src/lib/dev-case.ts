import "server-only";
import { cookies } from "next/headers";
import { DEV_CASE_COOKIE, type DevCase } from "./dev-case-shared";

/** 로컬 개발 전용 [케이스] 모드. 운영(production) 빌드에서는 항상 null 이라 아무 영향이 없다. DB 에는 아무것도 쓰지 않고 화면 값만 바꾼다. */
export { DEV_CASE_COOKIE, type DevCase } from "./dev-case-shared";

export async function readDevCase(): Promise<DevCase | null> {
  if (process.env.NODE_ENV !== "development") return null;
  const raw = (await cookies()).get(DEV_CASE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as DevCase;
  } catch {
    return null;
  }
}
