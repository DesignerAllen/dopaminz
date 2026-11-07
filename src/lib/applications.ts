/** 크루 가입 신청서 공용 상수·검증 (클라이언트/서버 공용) */
export const EXPERIENCES = ["처음 또는 1개월 미만", "6개월", "1년 미만", "2년 미만", "2년 이상"] as const;
export const GENDERS = ["남", "녀"] as const;
export const MIN_AGE = 14;
export const OLDEST_BIRTH_YEAR = 1960;

export type ApplicationInput = {
  name: string;
  birth_year: number;
  gender: (typeof GENDERS)[number];
  instagram_id: string;
  experience: (typeof EXPERIENCES)[number];
  gym_area: string;
  bouldering_level: string;
  reason: string;
};

export function birthYears(now = new Date()): number[] {
  const newest = now.getFullYear() - MIN_AGE;
  return Array.from({ length: newest - OLDEST_BIRTH_YEAR + 1 }, (_, i) => newest - i);
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** 모든 항목 필수. 서버에서도 반드시 다시 검증한다. */
export function parseApplication(raw: Record<string, unknown> | null): { error: string } | { value: ApplicationInput } {
  if (!raw) return { error: "입력값을 확인해 주세요" };
  const name = str(raw.name);
  if (!name) return { error: "이름을 입력해 주세요" };
  if (name.length > 50) return { error: "이름은 50자 이내로 입력해 주세요" };

  const birth_year = Number(raw.birth_year);
  if (!Number.isInteger(birth_year) || !birthYears().includes(birth_year)) return { error: "출생년도를 선택해 주세요" };

  const gender = str(raw.gender);
  if (!(GENDERS as readonly string[]).includes(gender)) return { error: "성별을 선택해 주세요" };

  const instagram_id = str(raw.instagram_id).replace(/^@+/, "");
  if (!instagram_id) return { error: "인스타그램 ID를 입력해 주세요" };
  if (!/^[A-Za-z0-9._]{1,30}$/.test(instagram_id)) return { error: "인스타그램 ID는 영문·숫자·마침표·밑줄 30자 이내만 가능해요" };

  const experience = str(raw.experience);
  if (!(EXPERIENCES as readonly string[]).includes(experience)) return { error: "클라이밍 경력을 선택해 주세요" };

  const gym_area = str(raw.gym_area);
  if (!gym_area) return { error: "주 암장 및 거주지역을 입력해 주세요" };
  if (gym_area.length > 100) return { error: "주 암장 및 거주지역은 100자 이내로 입력해 주세요" };

  const bouldering_level = str(raw.bouldering_level);
  if (!bouldering_level) return { error: "볼더링 난이도를 입력해 주세요" };
  if (bouldering_level.length > 100) return { error: "볼더링 난이도는 100자 이내로 입력해 주세요" };

  const reason = str(raw.reason);
  if (!reason) return { error: "가입 사유를 입력해 주세요" };
  if (reason.length > 2000) return { error: "가입 사유는 2000자 이내로 입력해 주세요" };

  return { value: { name, birth_year, gender: gender as ApplicationInput["gender"], instagram_id, experience: experience as ApplicationInput["experience"], gym_area, bouldering_level, reason } };
}

/** 신청서 상태 칩 색상(목록·상세 공용): 신규 초록 / 가입완료 파랑 / 반려 회색 */
export const STATUS_STYLE = { 신규: "bg-[#e6f6ec] text-[#16a34a]", 가입완료: "bg-[#e5f0ff] text-[#2563eb]", 반려: "bg-[#e9ecef] text-[#8b95a1]" } as const;
