export type SortKey = "joined-desc" | "joined-asc" | "name-asc" | "name-desc" | "login-desc";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "joined-desc", label: "가입 최신순" },
  { key: "joined-asc", label: "가입 오래된순" },
  { key: "name-asc", label: "이름 오름차순" },
  { key: "name-desc", label: "이름 내림차순" },
];

/** 관리자 회원 탭: 기본 정렬 기준 + 로그인 순 */
export const ADMIN_SORT_OPTIONS: { key: SortKey; label: string }[] = [...SORT_OPTIONS, { key: "login-desc", label: "로그인 순" }];

export const DEFAULT_SORT: SortKey = "joined-desc";

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "ko");

/** 로그인 순 기준 시각: 마지막 로그인(없으면 가입일 0시, 한국 시간) */
const loginStamp = (m: { joined_at: string; last_login_at?: string | null }) => Date.parse(m.last_login_at ?? `${m.joined_at}T00:00:00+09:00`);

/** 정렬한 새 배열을 돌려준다. 가입일이 같으면 이름 오름차순으로 정한다.
 *  login-desc: 가장 최근에 로그인한 순. 로그인 이력이 없는 회원은 가입일을 기준 시각으로 쓴다. */
export function sortMembers<T extends { name: string; joined_at: string; last_login_at?: string | null }>(list: T[], key: SortKey): T[] {
  const out = [...list];
  switch (key) {
    case "joined-desc":
      return out.sort((a, b) => (a.joined_at < b.joined_at ? 1 : a.joined_at > b.joined_at ? -1 : byName(a, b)));
    case "joined-asc":
      return out.sort((a, b) => (a.joined_at < b.joined_at ? -1 : a.joined_at > b.joined_at ? 1 : byName(a, b)));
    case "name-asc":
      return out.sort(byName);
    case "name-desc":
      return out.sort((a, b) => byName(b, a));
    case "login-desc":
      return out.sort((a, b) => loginStamp(b) - loginStamp(a) || byName(a, b));
  }
}
