// 0단계: 언론사 소스 검증
//
// 목적: 후보 언론사가 실제로 (1) RSS 를 주는지 (2) url_context 로 본문이 읽히는지 확인.
// 이 검증 없이 파이프라인을 만들면 배치가 빈 결과를 낸다.
//
// 실행: node scripts/verify-sources.js

import { config } from 'dotenv';
config({ path: '.env.local' }); // dotenv 는 .env 만 자동 로드하므로 명시 필요
import { GoogleGenAI } from '@google/genai';
import { XMLParser } from 'fast-xml-parser';
import { writeFileSync, mkdirSync } from 'node:fs';
import { CANDIDATES, DOMAIN_LABELS } from './sources.js';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY 없음. .env.local 을 확인하세요.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
// 2.5-flash 는 신규 사용자에게 폐지됨(404). 이 키로 사용 가능한 현행 모델.
const MODEL = 'gemini-3.5-flash';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

// RSS 에서 기사 링크 뽑기. RSS 2.0 / Atom 둘 다 대응.
async function fetchRssLinks(rssUrl, limit = 2) {
  const res = await fetch(rssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MovinBot/0.1)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);

  const xml = await res.text();
  const parsed = parser.parse(xml);

  const items = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  const list = Array.isArray(items) ? items : [items];

  return list.slice(0, limit).map((it) => {
    // Atom 은 link 가 객체({@_href}) 인 경우가 있다.
    let link = it.link;
    if (Array.isArray(link)) link = link[0];
    if (link && typeof link === 'object') link = link['@_href'];
    return {
      title: String(it.title?.['#text'] ?? it.title ?? '').trim(),
      url: String(link ?? '').trim(),
    };
  }).filter((x) => x.url.startsWith('http'));
}

// url_context 로 기사 본문이 읽히는지 확인.
// 본문을 못 읽으면 모델이 요약을 못 하거나 접근 실패 메타데이터가 돌아온다.
async function probeUrlContext(articleUrl, attempt = 0) {
  let res;
  try {
    res = await ai.models.generateContent({
      model: MODEL,
      contents: `다음 기사를 읽고 딱 한 문장으로 요약해줘. 본문에 접근할 수 없으면 정확히 "ACCESS_FAILED" 라고만 답해.\n\n${articleUrl}`,
      config: { tools: [{ urlContext: {} }] },
    });
  } catch (e) {
    // 503(혼잡)/429(레이트리밋)은 언론사 문제가 아니라 일시적 API 문제다.
    // 재시도하지 않으면 멀쩡한 소스를 잘못 제외하게 된다.
    const transient = /50[23]|429|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(e.message ?? '');
    if (transient && attempt < 3) {
      const wait = 5000 * 2 ** attempt;
      console.log(`  (일시적 오류, ${wait / 1000}초 후 재시도 ${attempt + 1}/3)`);
      await new Promise((r) => setTimeout(r, wait));
      return probeUrlContext(articleUrl, attempt + 1);
    }
    throw e;
  }

  const text = (res.text ?? '').trim();
  const meta = res.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? [];
  const statuses = meta.map((m) => m.urlRetrievalStatus ?? 'UNKNOWN');
  const retrieved = statuses.some((s) => String(s).includes('SUCCESS'));

  return {
    ok: retrieved && !text.includes('ACCESS_FAILED') && text.length > 10,
    statuses,
    sample: text.slice(0, 100),
  };
}

const results = [];

console.log('\n0단계: 언론사 소스 검증 시작');
console.log('='.repeat(60));

for (const c of CANDIDATES) {
  const row = { ...c, rssOk: false, articleOk: false, note: '' };
  process.stdout.write(`\n[${DOMAIN_LABELS[c.domain]}] ${c.name}\n`);

  // 1) RSS 확인
  let links = [];
  try {
    links = await fetchRssLinks(c.rss);
    row.rssOk = links.length > 0;
    console.log(`  RSS      : ${row.rssOk ? `OK (${links.length}건)` : '기사 없음'}`);
  } catch (e) {
    row.note = `RSS 실패: ${e.message}`;
    console.log(`  RSS      : 실패 - ${e.message}`);
    results.push(row);
    continue;
  }

  if (!links.length) {
    row.note = 'RSS 파싱됐으나 기사 0건';
    results.push(row);
    continue;
  }

  // 2) url_context 로 본문 접근 확인
  try {
    const probe = await probeUrlContext(links[0].url);
    row.articleOk = probe.ok;
    row.note = probe.statuses.join(',');
    row.testedUrl = links[0].url;
    console.log(`  본문접근 : ${probe.ok ? 'OK' : '실패'} [${probe.statuses.join(',')}]`);
    if (probe.ok) console.log(`  요약샘플 : ${probe.sample}...`);
  } catch (e) {
    row.note = `url_context 실패: ${e.message}`;
    console.log(`  본문접근 : 에러 - ${e.message}`);
  }

  results.push(row);
  await new Promise((r) => setTimeout(r, 3000)); // 연속 호출 간 간격
}

// 결과 요약
console.log('\n' + '='.repeat(60));
console.log('최종 결과\n');

const usable = results.filter((r) => r.rssOk && r.articleOk);
const broken = results.filter((r) => !(r.rssOk && r.articleOk));

for (const d of Object.keys(DOMAIN_LABELS)) {
  const inDomain = usable.filter((r) => r.domain === d);
  console.log(`${DOMAIN_LABELS[d]}: 사용가능 ${inDomain.length}개`);
  inDomain.forEach((r) => console.log(`   O ${r.name}`));
}

if (broken.length) {
  console.log('\n제외 대상:');
  broken.forEach((r) => console.log(`   X ${r.name} — ${r.note || 'RSS/본문 실패'}`));
}

mkdirSync('scripts/output', { recursive: true });
writeFileSync('scripts/output/source-verification.json', JSON.stringify(results, null, 2), 'utf-8');
console.log('\n상세 결과: scripts/output/source-verification.json');
