import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 생성된 DB 타입이 없으므로 느슨한 타입을 쓴다(추후 supabase gen types 로 교체 가능).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, "public", any> | null = null;

/** service_role 클라이언트. 서버 코드에서만 사용한다(RLS 우회). */
export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
