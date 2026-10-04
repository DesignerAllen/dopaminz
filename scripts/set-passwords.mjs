// 사용: npm run set-passwords -- <뷰어PIN 4자리> <관리자비밀번호>
// .env.local 의 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요. 초기 1회 또는 분실 시 복구용.
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const [pin, adminPw] = process.argv.slice(2);
if (!/^\d{4}$/.test(pin ?? "")) throw new Error("뷰어 PIN은 숫자 4자리여야 합니다");
const ok = adminPw && adminPw.length >= 8 && /[A-Za-z]/.test(adminPw) && /\d/.test(adminPw) && /[^A-Za-z0-9]/.test(adminPw);
if (!ok) throw new Error("관리자 비밀번호는 영문+숫자+특수기호 포함 8자 이상이어야 합니다");
if (pin === adminPw) throw new Error("두 비밀번호는 같을 수 없습니다");

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const row = {
  id: 1,
  viewer_pin_hash: await bcrypt.hash(pin, 12),
  viewer_pin_display: pin, // 관리자 설정 화면 표시용(0007 마이그레이션 필요)
  admin_password_hash: await bcrypt.hash(adminPw, 12),
  notice_fee: "월 20,000원",
  notice_account: "은행 000-0000-0000 (예금주)",
  updated_at: new Date().toISOString(),
};
let { error } = await db.from("settings").upsert(row);
if (error && /viewer_pin_display/.test(error.message)) {
  delete row.viewer_pin_display; // 0007 적용 전
  ({ error } = await db.from("settings").upsert(row));
}
if (error) throw error;
console.log("비밀번호를 저장했습니다. 공지(회비·계좌)는 관리자 설정에서 수정하세요.");
