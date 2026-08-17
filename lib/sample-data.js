// 배치 파이프라인 구현 전까지 화면 확인용 샘플.
// 실제 요약이 아니라 레이아웃 검증용 더미다. DB 에 데이터가 생기면 자동으로 대체된다.

export const SAMPLE = {
  finance: {
    readSeconds: 45,
    items: [
      {
        title: '4대 은행, 폭우 피해 지역 긴급 금융지원 나서',
        summary_lines: [
          '국내 4대 시중은행이 남부 폭우 피해 고객에게 긴급 생활안정자금 대출을 지원한다.',
          '피해 고객 대상 우대금리 적용과 기존 대출 만기 연장도 함께 시행된다.',
          '구호 텐트와 급식 차량 등 현장 지원 활동도 병행하고 있다.',
        ],
        keywords: ['금융지원', '재해대응', '우대금리'],
        source_name: '연합뉴스 경제',
        source_url: 'https://www.yna.co.kr/',
      },
      {
        title: '핀테크 업계, 마이데이터 2단계 개편 대응 분주',
        summary_lines: [
          '마이데이터 제도 개편으로 정보 제공 범위가 확대될 예정이다.',
          '주요 핀테크 기업들이 데이터 연동 시스템 정비에 착수했다.',
          '중소 사업자의 대응 비용 부담이 과제로 지적된다.',
        ],
        keywords: ['마이데이터', '규제', '핀테크'],
        source_name: '한국경제 금융',
        source_url: 'https://www.hankyung.com/',
      },
      {
        title: '가계대출 증가폭 3개월 만에 둔화',
        summary_lines: [
          '지난달 은행권 가계대출 증가폭이 전월 대비 축소됐다.',
          '주택담보대출 규제 강화가 영향을 준 것으로 분석된다.',
          '금융당국은 추가 관리 방안을 검토 중이다.',
        ],
        keywords: ['가계대출', '주담대', '금융당국'],
        source_name: '매일경제 경제',
        source_url: 'https://www.mk.co.kr/',
      },
    ],
    disclosures: [
      {
        corp_name: '카카오뱅크',
        summary: '분기 실적 공시 — 영업이익 전년 동기 대비 증가, 플랫폼 수익 비중 확대.',
        dart_url: 'https://dart.fss.or.kr/',
      },
      {
        corp_name: '토스뱅크',
        summary: '자본금 증자 결정 공시 — 여신 확대를 위한 자본 확충 목적.',
        dart_url: 'https://dart.fss.or.kr/',
      },
    ],
    vocab: {
      word: 'liquidity',
      meaning_ko: '유동성 — 자산을 현금으로 바꿀 수 있는 정도',
      example_sentence:
        'The bank strengthened its liquidity position ahead of the regulatory review.',
    },
  },

  ecommerce: {
    readSeconds: 38,
    items: [
      {
        title: '빅테크 출신 인재, AI 과학 스타트업 창업 러시',
        summary_lines: [
          '글로벌 빅테크 핵심 인재들이 AI 과학 분야 창업에 잇따라 나서고 있다.',
          '연구 자동화와 과학적 난제 해결을 목표로 한다.',
          'AI 경쟁 전장이 챗봇·코딩에서 순수과학으로 확장되는 흐름이다.',
        ],
        keywords: ['AI', '스타트업', '연구자동화'],
        source_name: '한국경제 IT',
        source_url: 'https://www.hankyung.com/',
      },
      {
        title: '이커머스 3사, 물류 자동화 투자 확대',
        summary_lines: [
          '주요 이커머스 기업들이 물류센터 자동화 설비 투자를 늘리고 있다.',
          '인건비 상승과 배송 경쟁이 투자 배경으로 꼽힌다.',
          '설비 도입 효과는 내년 하반기부터 가시화될 전망이다.',
        ],
        keywords: ['물류', '자동화', '투자'],
        source_name: '전자신문',
        source_url: 'https://www.etnews.com/',
      },
      {
        title: '삼성전자, 사내 익명 커뮤니티 실명제 전환',
        summary_lines: [
          '개정 정보통신망법 시행에 맞춰 사내 커뮤니티를 실명제로 바꾼다.',
          '임직원 보호와 건강한 소통 문화 확립이 목적이라고 밝혔다.',
          '업계 전반으로 유사 조치가 확산될지 주목된다.',
        ],
        keywords: ['정보통신망법', '사내문화', '삼성전자'],
        source_name: '매일경제 기업',
        source_url: 'https://www.mk.co.kr/',
      },
    ],
    disclosures: [
      {
        corp_name: '쿠팡',
        summary: '신규 물류센터 설립 투자 공시 — 수도권 남부 거점 확보 목적.',
        dart_url: 'https://dart.fss.or.kr/',
      },
      {
        corp_name: '네이버',
        summary: '자회사 지분 취득 공시 — 커머스 부문 수직 계열화 강화.',
        dart_url: 'https://dart.fss.or.kr/',
      },
    ],
    vocab: {
      word: 'fulfillment',
      meaning_ko: '풀필먼트 — 주문부터 배송까지 물류 전 과정을 대행하는 서비스',
      example_sentence:
        'The retailer expanded its fulfillment network to cut delivery times.',
    },
  },
};
