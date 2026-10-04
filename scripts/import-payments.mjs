// F-12 과거 납부 이력 이관(초기 1회): npm run import-payments -- 파일.csv [--dry]
// CSV 형식(헤더 필수):  name,joined_at,instagram_id,year_months[,status]
//   status 는 선택(회원|미노출, 기본 회원). 미노출은 hidden_reason '기타' 로 등록
//   year_months 는 납부한 달을 공백 또는 | 로 구분  예) 2025-08|2025-09|2025-10
//   - 같은 이름이 DB 에 없으면 새 회원으로 등록, 있으면 그 회원에 납부 기록을 추가
//   - 가입달에 납부가 있으면 '예외 납부'로 기록, 가입 이전 달은 건너뛰고 경고 출력
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [file, flag] = process.argv.slice(2);
if (!file) throw new Error("사용법: npm run import-payments -- 파일.csv [--dry]");
const dry = flag === "--dry";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const lines = readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
const head = lines.shift().split(",").map((s) => s.trim());
const col = (n) => head.indexOf(n);
if (["name", "joined_at", "year_months"].some((n) => col(n) < 0)) throw new Error("헤더에 name, joined_at, year_months 가 필요합니다");

let members = 0, payments = 0, skipped = 0;
for (const line of lines) {
  const c = line.split(",").map((s) => s.trim());
  const name = c[col("name")], joined = c[col("joined_at")], insta = (c[col("instagram_id")] || "").replace(/^@+/, "") || null;
  const status = c[col("status")] === "미노출" ? "미노출" : "회원";
  const yms = (c[col("year_months")] || "").split(/[|\s]+/).filter(Boolean);
  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(joined)) { console.warn(`건너뜀(형식 오류): ${line}`); skipped++; continue; }

  const { data: found } = await db.from("members").select("id").eq("name", name).limit(2);
  if (found?.length > 1) { console.warn(`건너뜀(동명이인 ${name}): DB에 같은 이름이 여러 명입니다`); skipped++; continue; }
  let id = found?.[0]?.id;
  if (!id) {
    members++;
    if (dry) id = -1;
    else {
      const { data, error } = await db.from("members").insert({ name, joined_at: joined, instagram_id: insta, status, hidden_reason: status === "미노출" ? "기타" : null }).select("id").single();
      if (error) throw error;
      id = data.id;
    }
  }
  const joinYm = joined.slice(0, 7);
  for (const ym of yms) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym) || ym < "2025-07") { console.warn(`건너뜀: ${name} ${ym}`); skipped++; continue; }
    if (ym < joinYm) { console.warn(`가입 이전 달이라 건너뜀: ${name} ${ym}`); skipped++; continue; }
    payments++;
    if (!dry) {
      const { error } = await db.from("payments").upsert({ member_id: id, year_month: ym, is_exception: ym === joinYm }, { onConflict: "member_id,year_month" });
      if (error) throw error;
    }
  }
}
console.log(`${dry ? "[미리보기] " : ""}신규 회원 ${members}명, 납부 ${payments}건 처리, 건너뜀 ${skipped}건`);
