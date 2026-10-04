// 시트 '크루권' 사용 내역 이관(초기 1회): npm run import-tickets [-- --dry]
// 입력: scripts/data/ticket-rows.txt  (사용일|구분(M=크루 모임,P=개인,T=파트너크루)|지점|수량|이름들)
//  - 금액은 DB 항목의 현재 단가 기준(크루원=price, 게스트=guest_price ?? price)
//  - 회원 이름이 members 에 있으면 크루원, 없으면 게스트. 동명이인은 사용일 시점에 가입 중인 가장 최근 가입 건에 연결
//  - 전 건 입금 완료 처리(paid_at = 사용일). PAID_ALL=false 로 바꾸면 모두 미입금
//  - ticket_requests 에 데이터가 이미 있으면 중단(중복 방지)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const dry = process.argv.includes("--dry");
const CENTER = "서울숲클라이밍", PAID_ALL = true;
const ITEM = { M: "크루 모임", P: "개인", T: "파트너크루" };
const ALIAS = { 푸름: "이푸름" };
const PASSES = [{ start_date: "2026-04-06", end_date: "2027-04-06", quantity: 100 }, { start_date: "2026-07-17", end_date: "2027-07-17", quantity: 100 }];
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ok = (r) => { if (r.error) throw r.error; return r.data; };

const { count } = ok(await db.from("ticket_requests").select("id", { count: "exact", head: true }).then((r) => (r.error ? r : { data: { count: r.count } })));
if (count > 0) { console.log(`ticket_requests 에 이미 ${count}건이 있어 중단합니다.`); process.exit(0); }

const center = ok(await db.from("ticket_centers").select("id,name").eq("name", CENTER).single());
const branches = ok(await db.from("ticket_branches").select("id,name").eq("center_id", center.id));
const items = ok(await db.from("ticket_items").select("id,name,price,guest_price").eq("center_id", center.id));
const members = ok(await db.from("members").select("id,name,joined_at"));
const byName = new Map(); for (const m of members) (byName.get(m.name) ?? byName.set(m.name, []).get(m.name)).push(m);
const pick = (name, d) => { const c = byName.get(name); if (!c) return null; const v = c.filter((m) => m.joined_at <= d); return (v.length ? v : c).sort((a, b) => b.joined_at.localeCompare(a.joined_at))[0]; };

const rows = readFileSync(new URL("./data/ticket-rows.txt", import.meta.url), "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => {
  const [d, k, br, q, names] = l.split("|");
  const list = names.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ALIAS[s] ?? s);
  if (+q !== list.length) throw new Error(`수량 불일치: ${l}`);
  return { d, k, br, list };
});

let nReq = 0, nPeople = 0, nMem = 0, nGuest = 0, sum = 0, paidReq = 0;
if (!dry) for (const p of PASSES) ok(await db.from("ticket_passes").insert({ center_id: center.id, ...p }));
for (const [i, r] of rows.entries()) {
  const item = items.find((x) => x.name === ITEM[r.k]); if (!item) throw new Error(`항목 없음: ${ITEM[r.k]}`);
  const branch = branches.find((b) => b.name === r.br); if (!branch) throw new Error(`지점 없음: ${r.br}`);
  const unit = item.price, guestUnit = item.guest_price ?? item.price;
  const people = r.list.map((name, pos) => { const m = pick(name, r.d); return { position: pos, member_id: m?.id ?? null, name, is_guest: !m, unit_price: m ? unit : guestUnit }; });
  const mc = people.filter((p) => !p.is_guest).length, total = people.reduce((a, p) => a + p.unit_price, 0);
  const paid = PAID_ALL, at = new Date(`${r.d}T00:00:00+09:00`).toISOString();
  const createdAt = new Date(new Date(at).getTime() + i * 1000).toISOString();
  nReq++; nPeople += people.length; nMem += mc; nGuest += people.length - mc; sum += total; if (paid) paidReq++;
  if (dry) continue;
  const req = ok(await db.from("ticket_requests").insert({
    used_on: r.d, center_id: center.id, branch_id: branch.id, item_id: item.id, center_name: center.name, branch_name: branch.name, item_name: item.name,
    unit_price: unit, guest_unit_price: guestUnit, member_count: mc, guest_count: people.length - mc, people_count: people.length, total_price: total,
    paid, paid_at: paid ? at : null, created_at: createdAt,
  }).select("id").single());
  ok(await db.from("ticket_request_people").insert(people.map((p) => ({ ...p, request_id: req.id, paid, paid_at: paid ? at : null }))));
}
console.log(`${dry ? "[미리보기] " : ""}구매 ${PASSES.length}건, 신청 ${nReq}건(입금 완료 ${paidReq}건), 이용자 ${nPeople}명(크루원 ${nMem} · 게스트 ${nGuest}), 합계 ${sum.toLocaleString("ko-KR")}원`);
