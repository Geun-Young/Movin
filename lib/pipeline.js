// 배치 파이프라인: RSS 수집 → url_context 로 본문 읽기 → 요약 → DB 저장.
// 유저 요청 경로에서는 절대 호출하지 않는다. 비용이 유저 수에 비례하게 되기 때문.

import { GoogleGenAI } from '@google/genai';
import { XMLParser } from 'fast-xml-parser';
import { WATCHLIST, fetchRecentDisclosures, summarizeDisclosures } from './dart.js';

// 2.5-flash 는 신규 사용자에게 폐지됨(404).
export const MODEL = 'gemini-3.5-flash';

// url_context 는 요청당 URL 20개까지.
const URLS_PER_REQUEST = 20;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

export async function fetchRssItems(rssUrl, limit = 4) {
  const res = await fetch(rssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MovinBot/0.1)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);

  const parsed = parser.parse(await res.text());
  const raw = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  const list = Array.isArray(raw) ? raw : [raw];

  return list.slice(0, limit).map((it) => {
    let link = it.link;
    if (Array.isArray(link)) link = link[0];
    if (link && typeof link === 'object') link = link['@_href'];
    return {
      title: String(it.title?.['#text'] ?? it.title ?? '').trim(),
      url: String(link ?? '').trim(),
      publishedAt: it.pubDate ?? it.published ?? null,
    };
  }).filter((x) => x.url.startsWith('http'));
}

// 503/429 는 언론사 문제가 아니라 일시적 API 혼잡이다.
// 재시도하지 않으면 매일 아침 기사가 랜덤하게 누락된다. (0단계에서 실측)
async function withRetry(fn, label, max = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const transient = /50[023]|429|UNAVAILABLE|RESOURCE_EXHAUSTED|fetch failed/i.test(e.message ?? '');
      if (!transient || attempt >= max) throw e;
      const wait = 5000 * 2 ** attempt;
      console.log(`  [재시도 ${attempt + 1}/${max}] ${label} — ${wait / 1000}초 대기`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          title: { type: 'string' },
          summary_lines: { type: 'array', items: { type: 'string' } },
          keywords: { type: 'array', items: { type: 'string' } },
        },
        required: ['url', 'title', 'summary_lines', 'keywords'],
      },
    },
    vocab: {
      type: 'object',
      properties: {
        word: { type: 'string' },
        meaning_ko: { type: 'string' },
        example_sentence: { type: 'string' },
        example_source_url: { type: 'string' },
      },
      required: ['word', 'meaning_ko', 'example_sentence'],
    },
  },
  required: ['items', 'vocab'],
};

// 3줄 요약 + 키워드 + 영단어를 한 번의 호출로 뽑는다 (토큰 절약).
export async function summarizeBatch(ai, urls, domainLabel) {
  const prompt = `너는 한국 직장인을 위한 업계 브리핑 편집자다. 아래 ${domainLabel} 분야 기사들을 읽고 JSON 으로 정리해라.

기사 URL:
${urls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

각 기사마다:
- title: 기사 제목을 한국어로 간결하게 (원문 제목 그대로가 아니라 핵심이 드러나게)
- summary_lines: 정확히 3줄. 각 줄은 한 문장이고 **45자 이내**로 짧게.
  출퇴근길에 한 손으로 쓱 넘겨보는 카드라 길면 안 읽힌다. 조사·수식어를 쳐내라.
- keywords: 2~4개의 핵심 키워드 (해시태그용, # 없이)
- url: 입력받은 URL 그대로

주의:
- 본문에 실제로 없는 내용을 지어내지 마라. 접근이 안 된 기사는 결과에서 빼라.
- 원문 표현을 그대로 길게 옮기지 말고 반드시 네 말로 압축해라.

추가로 vocab 하나:
- 위 기사들에 실제로 등장했거나 이 분야 실무에서 쓰이는 영어 단어 1개
- word, meaning_ko(한국어 뜻 + 짧은 설명), example_sentence(영어 예문 1개)`;

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      tools: [{ urlContext: {} }],
      responseMimeType: 'application/json',
      responseJsonSchema: SCHEMA,
    },
  });

  return JSON.parse(res.text);
}

// 한 도메인의 브리핑을 생성해 DB 에 저장한다.
export async function buildDomainBriefing({ sb, ai, domain, sources, today }) {
  console.log(`\n[${domain.name_ko}] 소스 ${sources.length}개`);

  // 1) RSS 수집
  const articles = [];
  for (const s of sources) {
    try {
      const items = await fetchRssItems(s.rss_url, 3);
      items.forEach((it) => articles.push({ ...it, sourceName: s.name }));
      console.log(`  RSS ${s.name}: ${items.length}건`);
    } catch (e) {
      console.log(`  RSS ${s.name}: 실패 (${e.message}) — 건너뜀`);
    }
  }

  if (!articles.length) {
    console.log('  수집된 기사 없음 — 중단');
    return null;
  }

  // 2) url_context 로 본문 읽고 요약 (20개씩)
  const summarized = [];
  let vocab = null;

  for (let i = 0; i < articles.length; i += URLS_PER_REQUEST) {
    const chunk = articles.slice(i, i + URLS_PER_REQUEST);
    const urls = chunk.map((a) => a.url);
    try {
      const out = await withRetry(
        () => summarizeBatch(ai, urls, domain.name_ko),
        `요약 ${i / URLS_PER_REQUEST + 1}번째 묶음`,
      );
      for (const item of out.items ?? []) {
        const origin = chunk.find((a) => a.url === item.url) ?? chunk[0];
        summarized.push({ ...item, sourceName: origin.sourceName, publishedAt: origin.publishedAt });
      }
      if (!vocab && out.vocab) vocab = out.vocab;
      console.log(`  요약: ${out.items?.length ?? 0}건 생성`);
    } catch (e) {
      console.log(`  요약 실패: ${e.message}`);
    }
  }

  if (!summarized.length) {
    console.log('  요약 결과 없음 — 중단');
    return null;
  }

  // "출퇴근 1분 스낵 콘텐츠" 컨셉이라 카드 수를 제한한다.
  // 제한 없이 저장하면 읽는시간이 5분을 넘어 기획 의도와 어긋난다.
  const MAX_CARDS = 6;
  if (summarized.length > MAX_CARDS) {
    console.log(`  ${summarized.length}건 중 상위 ${MAX_CARDS}건만 사용`);
    summarized.length = MAX_CARDS;
  }

  // 3) 읽는 시간 계산 — 한국어 분당 약 500자 기준
  const chars = summarized.reduce(
    (n, it) => n + (it.summary_lines ?? []).join('').length, 0);
  const readSeconds = Math.max(20, Math.round((chars / 500) * 60));

  // 4) 저장 (같은 날 재실행하면 덮어쓴다)
  const { data: briefing, error: bErr } = await sb
    .from('briefings')
    .upsert(
      { domain_id: domain.id, briefing_date: today, read_seconds: readSeconds },
      { onConflict: 'domain_id,briefing_date' },
    )
    .select('id')
    .single();

  if (bErr) throw new Error(`브리핑 저장 실패: ${bErr.message}`);

  await sb.from('briefing_items').delete().eq('briefing_id', briefing.id);
  await sb.from('vocab').delete().eq('briefing_id', briefing.id);

  const { error: iErr } = await sb.from('briefing_items').insert(
    summarized.map((it) => ({
      briefing_id: briefing.id,
      title: it.title,
      summary_lines: it.summary_lines,
      keywords: it.keywords ?? [],
      source_name: it.sourceName,
      source_url: it.url,
      published_at: it.publishedAt ? new Date(it.publishedAt).toISOString() : null,
    })),
  );
  if (iErr) throw new Error(`기사 저장 실패: ${iErr.message}`);

  // 5) 라이벌 왓치 — DART 키가 없으면 건너뛴다 (뉴스는 이미 저장됨)
  try {
    const dartKey = process.env.DART_API_KEY;
    if (dartKey) {
      const watch = WATCHLIST[domain.slug] ?? [];
      const raw = await fetchRecentDisclosures({ apiKey: dartKey, corpNames: watch, date: today });
      if (raw.length) {
        const withSummary = await withRetry(
          () => summarizeDisclosures(ai, MODEL, raw.slice(0, 4), domain.name_ko),
          '공시 요약',
        );
        await sb.from('disclosures').delete().eq('briefing_id', briefing.id);
        await sb.from('disclosures').insert(
          withSummary.map((d) => ({ ...d, briefing_id: briefing.id })),
        );
        console.log(`  공시 ${withSummary.length}건 저장`);
      } else {
        console.log('  공시: 오늘 해당 기업 공시 없음');
      }
    } else {
      console.log('  공시: DART_API_KEY 없음 — 건너뜀');
    }
  } catch (e) {
    console.log(`  공시 실패(무시): ${e.message}`);
  }

  if (vocab) {
    await sb.from('vocab').insert({
      briefing_id: briefing.id,
      word: vocab.word,
      meaning_ko: vocab.meaning_ko,
      example_sentence: vocab.example_sentence,
      example_source_url: vocab.example_source_url ?? null,
    });
  }

  console.log(`  저장 완료: 기사 ${summarized.length}건, 읽는시간 ${readSeconds}초`);
  return { count: summarized.length, readSeconds };
}

export function makeAi() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}
