// MotherDuck 스타일 시스템 공용 컴포넌트.
// 규칙: radius 2px 고정, 그림자는 하드 오프셋만, 텍스트/보더는 #383838.

const INK = 'var(--color-charcoal-ink)';

export function Nav() {
  return (
    <nav
      className="w-full bg-[var(--color-frost-white)] border-b"
      style={{ borderColor: INK }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <DuckMark />
          <span className="text-[16px] font-semibold">MOVIN</span>
        </div>
        <div className="hidden items-center gap-6 text-[12px] font-medium md:flex">
          <span>브리핑</span>
          <span>라이벌 왓치</span>
          <span>영단어</span>
          <span>가격</span>
        </div>
        <button
          className="rounded-[2px] border px-4 py-2 text-[12px] font-semibold text-white"
          style={{ background: 'var(--color-sky-crayon)', borderColor: INK, borderWidth: 1.5 }}
        >
          START FREE
        </button>
      </div>
    </nav>
  );
}

export function Marquee({ text = 'DATA + AI · 출퇴근 1분 브리핑' }) {
  const items = Array.from({ length: 8 }, (_, i) => (
    <span key={i} className="mx-8 whitespace-nowrap">{text}</span>
  ));
  return (
    <div
      className="w-full overflow-hidden py-3"
      style={{ background: 'var(--color-canary-banner)' }}
    >
      <div className="marquee-track flex w-max text-[18px] font-semibold uppercase">
        {items}{items}
      </div>
    </div>
  );
}

export function PrimaryButton({ children }) {
  return (
    <button
      className="btn-press shadow-hard rounded-[2px] border-2 px-6 py-[10px] text-[14px] font-medium"
      style={{ background: 'var(--color-sky-crayon)', borderColor: INK, color: INK }}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children }) {
  return (
    <button
      className="btn-press shadow-hard rounded-[2px] border-2 bg-white px-6 py-[10px] text-[14px] font-medium"
      style={{ borderColor: INK, color: INK }}
    >
      {children}
    </button>
  );
}

// 도메인 탭 — 레인보우 아웃라인 팔레트를 순환시킨다.
const RAINBOW = [
  'var(--color-coral-sketch)',
  'var(--color-mint-sketch)',
  'var(--color-lilac-sketch)',
  'var(--color-periwinkle-sketch)',
  'var(--color-peach-sketch)',
  'var(--color-lime-sketch)',
];

export function DomainTab({ label, active, index, href }) {
  return (
    <a
      href={href}
      className="btn-press shadow-hard inline-block rounded-[2px] border-2 px-5 py-[10px] text-[14px] font-medium no-underline"
      style={{
        background: active ? 'var(--color-ice-wash)' : 'var(--color-frost-white)',
        borderColor: active ? INK : RAINBOW[index % RAINBOW.length],
        color: INK,
      }}
    >
      {label}
    </a>
  );
}

// 뉴스 카드. 원문 링크와 출처는 저작권상 필수라 항상 노출한다.
export function BriefingCard({ item, index }) {
  return (
    <article
      className="rounded-[2px] border-2 bg-white p-8"
      style={{ borderColor: INK }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <span
          className="shrink-0 rounded-[2px] border px-2 py-1 text-[11px] font-semibold uppercase"
          style={{ background: 'var(--color-canary-banner)', borderColor: INK }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--color-pencil-gray)' }}>
          {item.source_name}
        </span>
      </div>

      <h3 className="mb-4 text-[18px] font-medium leading-[1.4]">{item.title}</h3>

      <ul className="mb-5 space-y-2">
        {(item.summary_lines || []).map((line, i) => (
          <li key={i} className="flex gap-2 text-[14px] leading-[1.6]">
            <span style={{ color: 'var(--color-sky-crayon)' }}>—</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mb-5 flex flex-wrap gap-2">
        {(item.keywords || []).map((k) => (
          <span
            key={k}
            className="rounded-[2px] border px-2 py-1 text-[11px]"
            style={{ background: 'var(--color-notebook-pale)', borderColor: 'var(--color-graphite)' }}
          >
            #{k}
          </span>
        ))}
      </div>

      <a
        href={item.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] font-medium underline"
        style={{ color: INK }}
      >
        원문 보기 ↗
      </a>
    </article>
  );
}

export function DisclosureCard({ d }) {
  return (
    <div className="rounded-[2px] border-2 bg-white p-6" style={{ borderColor: INK }}>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="rounded-[2px] border px-2 py-[2px] text-[11px] font-semibold"
          style={{ background: 'var(--color-duck-bill-orange)', borderColor: INK }}
        >
          공시
        </span>
        <span className="text-[14px] font-semibold">{d.corp_name}</span>
      </div>
      <p className="mb-3 text-[14px]">{d.summary}</p>
      {d.dart_url && (
        <a href={d.dart_url} target="_blank" rel="noopener noreferrer"
           className="text-[12px] underline" style={{ color: INK }}>
          DART 원문 ↗
        </a>
      )}
    </div>
  );
}

export function VocabCard({ v }) {
  return (
    <div
      className="shadow-hard rounded-[2px] border-2 p-8"
      style={{ background: 'var(--color-canary-banner)', borderColor: INK }}
    >
      <div className="mb-1 text-[11px] font-semibold uppercase">오늘의 영단어</div>
      <div className="font-brand-serif mb-2 text-[32px] leading-[1.2]">{v.word}</div>
      <div className="mb-4 text-[16px]">{v.meaning_ko}</div>
      {v.example_sentence && (
        <p className="border-t pt-4 text-[14px] italic" style={{ borderColor: INK }}>
          “{v.example_sentence}”
        </p>
      )}
    </div>
  );
}

// 손그림 오리 — 브랜드의 시그니처. 일부러 반듯하지 않게.
export function DuckMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <ellipse cx="19" cy="24" rx="12" ry="9" stroke={INK} strokeWidth="2" />
      <circle cx="26" cy="14" r="6.5" stroke={INK} strokeWidth="2" />
      <path d="M32 13 L38 15 L32 17" stroke={INK} strokeWidth="2"
            fill="var(--color-duck-bill-orange)" strokeLinejoin="round" />
      <circle cx="27.5" cy="12.5" r="1.2" fill={INK} />
      <path d="M12 30 L10 35 M18 31 L17 36" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CloudMark({ className = '', size = 90 }) {
  return (
    <svg className={className} width={size} height={size * 0.6} viewBox="0 0 100 60"
         fill="none" aria-hidden="true">
      <path d="M20 45 Q8 45 8 35 Q8 26 18 26 Q20 12 34 13 Q44 5 55 14 Q70 12 72 26 Q86 27 86 37 Q86 45 74 45 Z"
            stroke="var(--color-wet-cement)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
