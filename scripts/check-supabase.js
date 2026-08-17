// Supabase 연결 확인용. 스키마 적용 전/후 상태를 알려준다.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 없음');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { error } = await sb.from('domains').select('id').limit(1);

if (!error) {
  console.log('연결 OK / 스키마 적용됨');
} else if (error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message)) {
  console.log('연결 OK / 스키마 미적용 → supabase/schema.sql 을 실행하세요');
} else {
  console.log('연결 실패:', error.message);
  process.exit(1);
}
