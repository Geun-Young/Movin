// Supabase Management API 로 스키마를 적용한다.
// SUPABASE_ACCESS_TOKEN (sbp_...) 이 필요하다. service_role 키로는 DDL 을 못 돌린다.
//
// 실행: npm run migrate

import { config } from 'dotenv';
config({ path: '.env.local' });
import { readFileSync } from 'node:fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const URL_ = process.env.SUPABASE_URL;

if (!TOKEN || !URL_) {
  console.error('SUPABASE_ACCESS_TOKEN / SUPABASE_URL 필요');
  process.exit(1);
}

const ref = new URL(URL_).hostname.split('.')[0];
const sql = readFileSync('supabase/schema.sql', 'utf-8');

console.log(`프로젝트 ${ref} 에 스키마 적용 중...`);

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});

const body = await res.text();

if (!res.ok) {
  console.error(`실패 (${res.status}):`, body.slice(0, 500));
  process.exit(1);
}

console.log('스키마 적용 완료');
