// 배치 수동 실행 (Vercel Cron 이 호출할 로직과 동일).
// 실행: npm run batch

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { buildDomainBriefing, makeAi } from '../lib/pipeline.js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const ai = makeAi();

// KST 기준 날짜
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
console.log(`배치 실행 — ${today} (KST)`);

const { data: domains, error } = await sb.from('domains').select('id, slug, name_ko');
if (error) { console.error('도메인 조회 실패:', error.message); process.exit(1); }

for (const domain of domains) {
  const { data: sources } = await sb
    .from('sources').select('name, rss_url')
    .eq('domain_id', domain.id).eq('is_active', true);

  try {
    await buildDomainBriefing({ sb, ai, domain, sources: sources ?? [], today });
  } catch (e) {
    console.error(`[${domain.name_ko}] 실패:`, e.message);
  }
}

console.log('\n배치 완료');
