// 카카오 로컬 API(키워드 검색)로 전국 클라이밍센터를 수집해 docs/data/climbing-gyms-kakao.csv 로 저장한다.
// 사용: node --env-file=.env.local scripts/collect-gyms.mjs   (필요: KAKAO_REST_API_KEY)
// 열: 권역,시도,지역,암장명,출처,검수상태,주소,카카오ID,볼더링추정  (앞 6열은 build-gyms.mjs 와 동일)
import { writeFileSync } from "node:fs";

const KEY = process.env.KAKAO_REST_API_KEY;
if (!KEY) throw new Error("KAKAO_REST_API_KEY 가 없습니다 (.env.local)");

const AREAS = {
  서울: "강남구 강동구 강북구 강서구 관악구 광진구 구로구 금천구 노원구 도봉구 동대문구 동작구 마포구 서대문구 서초구 성동구 성북구 송파구 양천구 영등포구 용산구 은평구 종로구 중구 중랑구",
  인천: "중구 동구 미추홀구 연수구 남동구 부평구 계양구 서구 강화군 옹진군",
  경기: "수원 성남 의정부 안양 부천 광명 평택 동두천 안산 고양 과천 구리 남양주 오산 시흥 군포 의왕 하남 용인 파주 이천 안성 김포 화성 광주 양주 포천 여주 연천 가평 양평",
  부산: "중구 서구 동구 영도구 부산진구 동래구 남구 북구 해운대구 사하구 금정구 강서구 연제구 수영구 사상구 기장군",
  대구: "중구 동구 서구 남구 북구 수성구 달서구 달성군 군위군",
  광주: "동구 서구 남구 북구 광산구",
  대전: "동구 중구 서구 유성구 대덕구",
  울산: "중구 남구 동구 북구 울주군",
  세종: "세종",
  강원: "춘천 원주 강릉 동해 태백 속초 삼척 홍천 횡성 영월 평창 정선 철원 화천 양구 인제 고성 양양",
  충북: "청주 충주 제천 음성 진천 괴산 증평 옥천 영동 보은 단양",
  충남: "천안 공주 보령 아산 서산 논산 계룡 당진 금산 부여 서천 청양 홍성 예산 태안",
  전북: "전주 군산 익산 정읍 남원 김제 완주 진안 무주 장수 임실 순창 고창 부안",
  전남: "목포 여수 순천 나주 광양 담양 곡성 구례 고흥 보성 화순 장흥 강진 해남 영암 무안 함평 영광 장성 완도 진도 신안",
  경북: "포항 경주 김천 안동 구미 영주 영천 상주 문경 경산 의성 청송 영양 영덕 청도 고령 성주 칠곡 예천 봉화 울진 울릉",
  경남: "창원 진주 통영 사천 김해 밀양 거제 양산 의령 함안 창녕 고성 남해 하동 산청 함양 거창 합천",
  제주: "제주시 서귀포시",
};
const KEYWORDS = ["클라이밍", "볼더링"];
const EXCLUDE = /스포츠|^더월클라이밍|^디스커버리 클라임스퀘어|춘클릿지|인어바위|비밀기지|빙벽|아이스|빙장|암장|암벽|용소빙장|아카데미|센터|실내|몽키즈|시소|연구소|써니사이드|경기장|인공암벽장|암벽오르기|공원|협회|연맹|산악회|산악문화|학교|대학|초등|중학|고등|등산학교|스포츠센터$|체육관$/;
const BOULDER = /볼더|boulder/i;

// 카카오 주소의 시도 표기(강원특별자치도, 전남광주통합특별시 등)를 AREAS 키로 맞춘다.
const GWANGJU_GU = new Set(["동구", "서구", "남구", "북구", "광산구"]);
function normalizeSido(head, second) {
  if (head === "전남광주통합특별시") return GWANGJU_GU.has(second) ? "광주" : "전남";
  if (head === "광주광역시") return "광주";
  const short = head.replace(/(특별자치도|특별자치시|특별시|광역시)$/, "");
  return short.length > 1 ? short : head;
}

const regionOf =(sido) => (sido === "서울" ? "서울" : sido === "인천" || sido === "경기" ? "수도권" : "수도권외");

async function search(query, page) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.search = new URLSearchParams({ query, size: "15", page: String(page) });
  for (let tries = 0; tries < 3; tries++) {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KEY}` } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 1000 * (tries + 1))); continue; }
    throw new Error(`${res.status} ${await res.text()} (${query})`);
  }
  throw new Error(`재시도 초과: ${query}`);
}

const jobs = [];
for (const [sido, names] of Object.entries(AREAS))
  for (const name of names.split(" ")) for (const kw of KEYWORDS) jobs.push({ sido, query: `${sido} ${name} ${kw}`, area: name });

const found = new Map(); // 카카오 id → row
let done = 0;
async function run(job) {
  for (let page = 1; page <= 3; page++) {
    const d = await search(job.query, page);
    for (const p of d.documents) {
      if (!p.category_name.includes("클라이밍") || found.has(p.id)) continue;
      const [head, second = ""] = p.address_name.split(" ");
      const sido = normalizeSido(head, second);
      if (!(sido in AREAS)) continue;
      found.set(p.id, { sido, area: second, name: p.place_name.replace(/,/g, " "), addr: p.road_address_name || p.address_name, id: p.id });
    }
    if (d.meta.is_end) break;
  }
  if (++done % 50 === 0) console.log(`${done}/${jobs.length} 검색, 누적 ${found.size}곳`);
}

const queue = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => { for (let j; (j = queue.shift()); ) await run(j); }));

const rows = [...found.values()]
  .filter((r) => !EXCLUDE.test(r.name))
  .sort((a, b) => Object.keys(AREAS).indexOf(a.sido) - Object.keys(AREAS).indexOf(b.sido) || a.area.localeCompare(b.area, "ko") || a.name.localeCompare(b.name, "ko"));

const head = "권역,시도,지역,암장명,출처,검수상태,주소,카카오ID,볼더링추정";
const lines = rows.map((r) => [regionOf(r.sido), r.sido, r.area, r.name, "카카오 로컬 API", "미검수", r.addr.replace(/,/g, " "), r.id, BOULDER.test(r.name) ? "Y" : ""].join(","));
const out = new URL("../docs/data/climbing-gyms-kakao.csv", import.meta.url);
writeFileSync(out, "﻿" + [head, ...lines].join("\n") + "\n");

const count = (f) => rows.filter(f).length;
console.log(`완료: 총 ${rows.length}곳 (제외 ${found.size - rows.length}) | 서울 ${count((r) => r.sido === "서울")} / 수도권(인천·경기) ${count((r) => r.sido === "인천" || r.sido === "경기")} / 수도권외 ${count((r) => regionOf(r.sido) === "수도권외")}`);
