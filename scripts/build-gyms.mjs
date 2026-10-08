// docs/data/climbing-gyms-kakao.csv → src/lib/gyms.ts 생성. CSV 를 갱신한 뒤 `npm run build-gyms` 로 다시 만든다.
// 열은 헤더 이름으로 읽는다(권역·시도·지역·암장명 필수, 주소 선택). 권역: 서울 / 수도권 / 수도권외
import { readFileSync, writeFileSync } from "node:fs";

const REGION = { 서울: "seoul", 수도권: "metro", 수도권외: "etc" };
const src = new URL("../docs/data/climbing-gyms-kakao.csv", import.meta.url);
const out = new URL("../src/lib/gyms.ts", import.meta.url);

// 암장 id: 권역+이름의 해시(순서가 바뀌어도 공유 URL 이 유지된다)
function hash(s) {
  let h = 5381;
  for (const c of s) h = ((h * 33) ^ c.codePointAt(0)) >>> 0;
  return h.toString(36).padStart(7, "0");
}

const [head, ...rows] = readFileSync(src, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
const col = Object.fromEntries(head.split(",").map((h, i) => [h.trim(), i]));
const seen = new Set();
const gyms = [];
for (const line of rows) {
  const f = line.split(",").map((s) => s.trim());
  const [권역, 시도, 지역, 암장명] = [f[col.권역], f[col.시도], f[col.지역], f[col.암장명]];
  const address = col.주소 === undefined ? "" : f[col.주소];
  const region = REGION[권역];
  if (!region || !암장명) { console.warn("건너뜀:", line); continue; }
  const id = `${region}-${hash(region + 암장명)}`;
  if (seen.has(id)) { console.warn("중복:", 암장명); continue; }
  seen.add(id);
  gyms.push({ id, name: 암장명, region, area: 시도 === 지역 ? 시도 : `${시도} ${지역}`, ...(address ? { address } : {}) });
}

const body = gyms.map((g) => `  ${JSON.stringify(g)},`).join("\n");
writeFileSync(out, `// 자동 생성 파일 — 직접 수정하지 말고 docs/data/climbing-gyms-kakao.csv 를 고친 뒤 \`npm run build-gyms\` 를 실행하세요.
export type GymRegion = "seoul" | "metro" | "etc";
export type Gym = { id: string; name: string; region: GymRegion; area: string; address?: string };

export const REGIONS: { value: GymRegion; label: string }[] = [
  { value: "seoul", label: "서울권" },
  { value: "metro", label: "서울 외 수도권" },
  { value: "etc", label: "수도권 외" },
];

export const GYMS: Gym[] = [
${body}
];

export const gymsOf = (region: GymRegion) => GYMS.filter((g) => g.region === region);
export const findGym = (id: string) => GYMS.find((g) => g.id === id);
`);
console.log(`${gyms.length}곳 생성`);
