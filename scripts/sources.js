// 0단계 검증용 후보 언론사 RSS 목록.
// 여기 있는 건 "후보"일 뿐이다. verify-sources.js 로 실제 호출해서
// 읽히는 곳만 최종 소스로 채택한다.
// url_context 는 robots.txt 를 준수하고 페이월/로그인 페이지를 읽지 못하므로,
// 유명한 매체라도 막힐 수 있다.

export const CANDIDATES = [
  // ── 금융 / 핀테크 ─────────────────────────────
  {
    domain: 'finance',
    name: '한국경제 - 금융',
    rss: 'https://www.hankyung.com/feed/finance',
  },
  {
    domain: 'finance',
    name: '매일경제 - 경제',
    rss: 'https://www.mk.co.kr/rss/30100041/',
  },
  // 서울경제는 RSS 주소가 전부 404 라 후보에서 제외했다 (2026-08 확인).
  {
    domain: 'finance',
    name: '연합뉴스 - 경제',
    rss: 'https://www.yna.co.kr/rss/economy.xml',
  },
  {
    domain: 'finance',
    name: '아시아경제 - 경제',
    rss: 'https://www.asiae.co.kr/rss/economy.htm',
  },

  // ── 이커머스 / 유통 ───────────────────────────
  {
    domain: 'ecommerce',
    name: '한국경제 - IT',
    rss: 'https://www.hankyung.com/feed/it',
  },
  {
    domain: 'ecommerce',
    name: '매일경제 - 기업',
    rss: 'https://www.mk.co.kr/rss/50100032/',
  },
  {
    domain: 'ecommerce',
    name: '전자신문 - 전체',
    rss: 'https://rss.etnews.com/Section901.xml',
  },
  {
    domain: 'ecommerce',
    name: '지디넷코리아',
    rss: 'https://feeds.feedburner.com/zdkorea',
  },
  {
    domain: 'ecommerce',
    name: '아웃스탠딩/플래텀 계열 - 벤처스퀘어',
    rss: 'https://www.venturesquare.net/feed',
  },
];

export const DOMAIN_LABELS = {
  finance: '금융/핀테크',
  ecommerce: '이커머스/유통',
};
