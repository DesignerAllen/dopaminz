export type SortKey = "joined-desc" | "joined-asc" | "name-asc" | "name-desc";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "joined-desc", label: "가입 최신순" },
  { key: "joined-asc", label: "가입 오래된순" },
  { key: "name-asc", label: "이름 오름차순" },
  { key: "name-desc", label: "이름 내림차순" },
];

export const DEFAULT_SORT: SortKey = "joined-desc";

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "ko");

/** 정렬한 새 배열을 돌려준다. 가입일이 같으면 이름 오름차순으로 정한다. */
export function sortMembers<T extends { name: string; joined_at: string }>(list: T[], key: SortKey): T[] {
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
  }
}
