import { createClient } from '@supabase/supabase-js';
import { buildDomainBriefing, makeAi } from '../../../../lib/pipeline';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Vercel Cron 이 매일 06:00 KST 에 호출한다.
// 공개 URL 이므로 CRON_SECRET 으로 보호한다.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const ai = makeAi();
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  const { data: domains, error } = await sb.from('domains').select('id, slug, name_ko');
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = {};
  for (const domain of domains) {
    const { data: sources } = await sb
      .from('sources').select('name, rss_url')
      .eq('domain_id', domain.id).eq('is_active', true);
    try {
      results[domain.slug] = await buildDomainBriefing({
        sb, ai, domain, sources: sources ?? [], today,
      });
    } catch (e) {
      results[domain.slug] = { error: e.message };
    }
  }

  return Response.json({ date: today, results });
}
