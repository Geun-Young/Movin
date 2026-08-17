import { getServerSupabase } from '../lib/supabase';
import {
  Nav, Marquee, PrimaryButton, OutlineButton, DomainTab,
  BriefingCard, DisclosureCard, VocabCard, DuckMark, CloudMark,
} from './components';
import { SAMPLE } from '../lib/sample-data';

export const dynamic = 'force-dynamic';

const INK = 'var(--color-charcoal-ink)';

// DB 에 오늘치 브리핑이 있으면 그걸 쓰고, 없으면 샘플로 화면을 보여준다.
// (배치 파이프라인 구현 전이라 DB 는 아직 비어 있다)
async function loadBriefing(slug) {
  const sb = getServerSupabase();
  if (!sb) return { ...SAMPLE[slug], isLive: false, reason: 'env 없음' };

  const { data: domain, error: dErr } = await sb
    .from('domains').select('id, name_ko').eq('slug', slug).maybeSingle();

  if (dErr || !domain) {
    return { ...SAMPLE[slug], isLive: false, reason: '스키마 미적용' };
  }

  const { data: briefing } = await sb
    .from('briefings').select('id, read_seconds, briefing_date')
    .eq('domain_id', domain.id).order('briefing_date', { ascending: false })
    .limit(1).maybeSingle();

  if (!briefing) {
    return { ...SAMPLE[slug], isLive: false, reason: '배치 미실행' };
  }

  const [{ data: items }, { data: disclosures }, { data: vocab }] = await Promise.all([
    sb.from('briefing_items').select('*').eq('briefing_id', briefing.id),
    sb.from('disclosures').select('*').eq('briefing_id', briefing.id),
    sb.from('vocab').select('*').eq('briefing_id', briefing.id).maybeSingle()
      .then((r) => ({ data: r.data })),
  ]);

  return {
    items: items ?? [],
    disclosures: disclosures ?? [],
    vocab: vocab ?? null,
    readSeconds: briefing.read_seconds,
    isLive: true,
  };
}

const DOMAINS = [
  { slug: 'finance', label: '금융 / 핀테크' },
  { slug: 'ecommerce', label: '이커머스 / 유통' },
];

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const active = DOMAINS.some((d) => d.slug === sp?.domain) ? sp.domain : 'finance';
  const data = await loadBriefing(active);

  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16">
        <CloudMark className="absolute left-[6%] top-[12%] hidden lg:block" />
        <CloudMark className="absolute right-[8%] top-[24%] hidden lg:block" size={64} />

        <div className="mx-auto max-w-[1200px] text-center">
          <h1 className="mx-auto max-w-[900px] text-[40px] font-light uppercase leading-[1.1] md:text-[56px]">
            출퇴근 10분,<br />업계가 읽힌다
          </h1>
          <p className="mx-auto mt-6 max-w-[600px] text-[16px] md:text-[18px]">
            매일 아침 AI가 업계 뉴스를 3줄로 정리합니다.
            한 손으로 넘겨보는 카드 브리핑.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <PrimaryButton>무료로 시작하기</PrimaryButton>
            <OutlineButton>샘플 브리핑 보기</OutlineButton>
          </div>
        </div>
      </section>

      <Marquee />

      {/* 브리핑 */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-[24px] font-medium md:text-[32px]">오늘의 브리핑</h2>
              <p className="mt-2 text-[14px]" style={{ color: 'var(--color-graphite)' }}>
                이 리포트를 읽는 데 약 {data.readSeconds}초 걸립니다
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {DOMAINS.map((d, i) => (
                <DomainTab key={d.slug} label={d.label} index={i}
                           active={d.slug === active} href={`/?domain=${d.slug}`} />
              ))}
            </div>
          </div>

          {!data.isLive && (
            <div className="mb-8 rounded-[2px] border-2 px-5 py-3 text-[13px]"
                 style={{ borderColor: INK, background: 'var(--color-peach-blush)' }}>
              <strong>샘플 데이터입니다</strong> — {data.reason}.
              실제 기사는 배치 파이프라인 구현 후 표시됩니다.
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item, i) => (
              <BriefingCard key={item.id ?? i} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* 라이벌 왓치 + 영단어 */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-2 text-[24px] font-medium">라이벌 왓치</h2>
            <p className="mb-6 text-[14px]" style={{ color: 'var(--color-graphite)' }}>
              경쟁사 공시를 AI가 요약합니다 · 출처 DART
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.disclosures.map((d, i) => <DisclosureCard key={d.id ?? i} d={d} />)}
            </div>
          </div>

          <div className="relative">
            {data.vocab && <VocabCard v={data.vocab} />}
            <div className="mt-8 flex items-end justify-end gap-3">
              <DuckMark size={64} />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-12" style={{ borderColor: INK }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DuckMark size={22} />
            <span className="text-[14px] font-semibold">MOVIN</span>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--color-pencil-gray)' }}>
            기사 저작권은 각 언론사에 있습니다 · 요약본은 원문 링크와 함께 제공됩니다
          </p>
        </div>
      </footer>
    </>
  );
}
