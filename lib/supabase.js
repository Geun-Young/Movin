import { createClient } from '@supabase/supabase-js';

// 서버 전용 클라이언트. service_role 키는 절대 클라이언트로 내보내지 않는다.
export function getServerSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
