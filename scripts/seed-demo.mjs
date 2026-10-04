// 데모 데이터 적재: npm run seed-demo
// members 테이블이 비어 있을 때만 실행한다(실데이터를 덮어쓰지 않기 위해).
// 지우려면 Supabase SQL Editor 에서: truncate payments, members restart identity cascade;
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const seed = JSON.parse(readFileSync(new URL("../../handoff/seed.json", import.meta.url), "utf8"));
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { count, error: cErr } = await db.from("members").select("id", { count: "exact", head: true });
if (cErr) throw cErr;
if (count > 0) {
  console.log(`members 에 이미 ${count}건이 있어 적재하지 않았습니다.`);
  process.exit(0);
}

const idMap = new Map();
for (const m of seed.members) {
  const { data, error } = await db
    .from("members")
    .insert({ name: m.name, joined_at: m.joined_at, instagram_id: m.instagram_id, status: m.status, hidden_reason: m.hidden_reason })
    .select("id")
    .single();
  if (error) throw error;
  idMap.set(m.id, data.id);
}
const { error: pErr } = await db.from("payments").insert(
  seed.payments.map((p) => ({ member_id: idMap.get(p.member_id), year_month: p.year_month, is_exception: p.is_exception, paid_at: p.paid_at })),
);
if (pErr) throw pErr;
const { error: sErr } = await db.from("settings").update({ notice_fee: seed.settings.notice_fee, notice_account: seed.settings.notice_account }).eq("id", 1);
if (sErr) throw sErr;
console.log(`데모 데이터 적재 완료: 회원 ${seed.members.length}명, 납부 ${seed.payments.length}건`);
