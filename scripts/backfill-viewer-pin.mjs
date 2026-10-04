// 사용: npm run backfill-viewer-pin -- <현재 뷰어 PIN 4자리>
// 해시로만 저장돼 있던 기존 뷰어 비밀번호를 관리자 설정 화면에 표시할 수 있도록 viewer_pin_display 에 채운다.
// 입력한 값이 실제 현재 비밀번호와 일치할 때만 저장한다(해시로 검증).
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const [pin] = process.argv.slice(2);
if (!/^\d{4}$/.test(pin ?? "")) throw new Error("뷰어 PIN은 숫자 4자리여야 합니다");

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await db.from("settings").select("viewer_pin_hash").eq("id", 1).single();
if (error) throw error;
if (!(await bcrypt.compare(pin, data.viewer_pin_hash))) throw new Error("현재 뷰어 비밀번호와 일치하지 않아 저장하지 않았습니다");
const { error: uErr } = await db.from("settings").update({ viewer_pin_display: pin }).eq("id", 1);
if (uErr) throw uErr;
console.log("현재 뷰어 비밀번호를 관리자 설정 화면에 표시하도록 저장했습니다.");
