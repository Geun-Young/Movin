// 라이벌 왓치 — OpenDART 공시 수집.
// 공시는 공공데이터라 저작권·표시 의무가 자유롭다. 무료, 일 20,000건.
// DART_API_KEY 가 없으면 조용히 건너뛴다 (뉴스 파이프라인은 계속 동작해야 하므로).

// 도메인별 관심 기업. corp_code 는 OpenDART 고유번호(8자리).
// 지금은 이름만 두고, 키가 생기면 corpCode 조회로 채운다.
export const WATCHLIST = {
  finance: ['카카오뱅크', '토스뱅크', '케이뱅크', '카카오페이'],
  ecommerce: ['쿠팡', '네이버', '이마트', '롯데쇼핑'],
};

const DART_BASE = 'https://opendart.fss.or.kr/api';

// 기업명 → corp_code 매핑은 corpCode.xml (zip) 을 받아야 해서
// 최초 1회만 수행하고 결과를 캐시하는 편이 좋다.
// MVP 에서는 공시검색 API 로 최근 공시를 도메인 키워드로 가져온다.
export async function fetchRecentDisclosures({ apiKey, corpNames, date }) {
  if (!apiKey) return [];

  const results = [];
  const bgnDe = date.replace(/-/g, '');

  for (const name of corpNames) {
    try {
      const url = new URL(`${DART_BASE}/list.json`);
      url.searchParams.set('crtfc_key', apiKey);
      url.searchParams.set('bgn_de', bgnDe);
      url.searchParams.set('end_de', bgnDe);
      url.searchParams.set('page_count', '5');

      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;

      const json = await res.json();
      if (json.status !== '000') continue; // 013 = 조회된 데이터 없음

      for (const it of json.list ?? []) {
        if (!it.corp_name?.includes(name)) continue;
        results.push({
          corp_name: it.corp_name,
          report_name: it.report_nm,
          disclosed_at: it.rcept_dt
            ? `${it.rcept_dt.slice(0, 4)}-${it.rcept_dt.slice(4, 6)}-${it.rcept_dt.slice(6, 8)}`
            : null,
          dart_url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${it.rcept_no}`,
        });
      }
    } catch {
      // 개별 기업 실패는 무시하고 계속 — 공시는 부가 기능이다.
    }
  }
  return results;
}

// 공시 제목을 한 줄 요약으로 바꾼다.
export async function summarizeDisclosures(ai, model, items, domainLabel) {
  if (!items.length) return [];

  const res = await ai.models.generateContent({
    model,
    contents: `다음은 ${domainLabel} 분야 기업들의 오늘 공시 목록이다.
각 공시가 무엇을 뜻하는지 직장인이 이해할 수 있게 한 문장으로 풀어써라.

${items.map((d, i) => `${i + 1}. ${d.corp_name} — ${d.report_name}`).join('\n')}

공시 제목에 없는 내용을 추측해서 덧붙이지 마라.`,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          summaries: {
            type: 'array',
            items: {
              type: 'object',
              properties: { index: { type: 'integer' }, summary: { type: 'string' } },
              required: ['index', 'summary'],
            },
          },
        },
        required: ['summaries'],
      },
    },
  });

  const out = JSON.parse(res.text);
  return items.map((d, i) => ({
    ...d,
    summary: out.summaries?.find((s) => s.index === i + 1)?.summary ?? d.report_name,
  }));
}
