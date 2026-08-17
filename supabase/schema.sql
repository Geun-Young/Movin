-- Movin 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행.

create table if not exists domains (
  id         bigserial primary key,
  slug       text unique not null,
  name_ko    text not null,
  created_at timestamptz default now()
);

-- 0단계 검증을 통과한 소스만 등록한다.
-- is_active=false 는 robots.txt 차단 등으로 본문을 못 읽는 곳.
create table if not exists sources (
  id         bigserial primary key,
  domain_id  bigint references domains(id) on delete cascade,
  name       text not null,
  rss_url    text not null,
  is_active  boolean default true,
  created_at timestamptz default now(),
  unique (domain_id, rss_url)
);

-- 배치 산출물. 도메인 × 날짜로 하루 한 건.
create table if not exists briefings (
  id            bigserial primary key,
  domain_id     bigint references domains(id) on delete cascade,
  briefing_date date not null,
  read_seconds  int default 0,
  created_at    timestamptz default now(),
  unique (domain_id, briefing_date)
);

create table if not exists briefing_items (
  id           bigserial primary key,
  briefing_id  bigint references briefings(id) on delete cascade,
  title        text not null,
  summary_lines jsonb not null,   -- 3줄 요약
  keywords     jsonb default '[]',
  source_name  text,
  source_url   text not null,     -- 원문 링크. 저작권 완화책이라 필수.
  published_at timestamptz,
  created_at   timestamptz default now()
);

create table if not exists disclosures (
  id           bigserial primary key,
  briefing_id  bigint references briefings(id) on delete cascade,
  corp_name    text not null,
  report_name  text,
  summary      text,
  disclosed_at date,
  dart_url     text
);

create table if not exists vocab (
  id            bigserial primary key,
  briefing_id   bigint references briefings(id) on delete cascade,
  word          text not null,
  meaning_ko    text,
  example_sentence text,
  example_source_url text
);

create index if not exists idx_items_briefing on briefing_items(briefing_id);
create index if not exists idx_briefings_lookup on briefings(domain_id, briefing_date desc);

-- 도메인 시드
insert into domains (slug, name_ko) values
  ('finance',   '금융/핀테크'),
  ('ecommerce', '이커머스/유통')
on conflict (slug) do nothing;

-- 0단계에서 실제 검증된 소스만 등록
insert into sources (domain_id, name, rss_url)
select d.id, s.name, s.rss_url from domains d
join (values
  ('finance',   '한국경제 금융',  'https://www.hankyung.com/feed/finance'),
  ('finance',   '매일경제 경제',  'https://www.mk.co.kr/rss/30100041/'),
  ('finance',   '연합뉴스 경제',  'https://www.yna.co.kr/rss/economy.xml'),
  ('ecommerce', '한국경제 IT',    'https://www.hankyung.com/feed/it'),
  ('ecommerce', '매일경제 기업',  'https://www.mk.co.kr/rss/50100032/'),
  ('ecommerce', '전자신문',       'https://rss.etnews.com/Section901.xml'),
  ('ecommerce', '지디넷코리아',   'https://feeds.feedburner.com/zdkorea')
) as s(slug, name, rss_url) on d.slug = s.slug
on conflict (domain_id, rss_url) do nothing;

-- MVP 는 공개 읽기. 쓰기는 서버(service_role)만.
alter table domains        enable row level security;
alter table sources        enable row level security;
alter table briefings      enable row level security;
alter table briefing_items enable row level security;
alter table disclosures    enable row level security;
alter table vocab          enable row level security;

do $$
declare t text;
begin
  foreach t in array array['domains','sources','briefings','briefing_items','disclosures','vocab'] loop
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
  end loop;
end $$;
