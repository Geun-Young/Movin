// 모바일 레이아웃 검증. AGENTS.md 의 모바일 규칙이 실제로 지켜지는지 확인한다.
// 눈으로 "괜찮아 보인다" 가 아니라 가로 오버플로와 터치 대상 크기를 실측한다.
//
// 실행: npm run check:mobile   (dev 서버가 떠 있어야 함)

import { chromium } from 'playwright';

const WIDTHS = [375, 390, 430];
const BASE = process.env.CHECK_URL ?? 'http://localhost:3000';

const browser = await chromium.launch();
let failed = false;

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // 1) 가로 스크롤 발생 여부
  const { scrollW, clientW } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  const overflow = scrollW - clientW;

  // 2) 넘치는 요소 특정
  // overflow:hidden 컨테이너 안(마퀴 등)은 잘려서 스크롤을 유발하지 않으므로 제외한다.
  const offenders = await page.evaluate((w) => {
    const clipped = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ov = getComputedStyle(p).overflowX;
        if (ov === 'hidden' || ov === 'clip' || ov === 'auto' || ov === 'scroll') return true;
      }
      return false;
    };
    const bad = [];
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > w + 1 || r.left < -1) && !clipped(el)) {
        bad.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() ?? '').slice(0, 45),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
    }
    return bad.slice(0, 5);
  }, width);

  // 3) 터치 대상 44px 확인
  const smallTargets = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('a, button')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.height < 44) {
        bad.push({
          text: (el.textContent ?? '').trim().slice(0, 22),
          h: Math.round(r.height),
        });
      }
    }
    return bad;
  });

  const ok = overflow <= 0 && smallTargets.length === 0;
  if (!ok) failed = true;

  console.log(`\n[${width}px] ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`  가로 오버플로: ${overflow > 0 ? `${overflow}px 초과` : '없음'}`);
  if (offenders.length) {
    console.log('  넘치는 요소:');
    offenders.forEach((o) => console.log(`    <${o.tag}> ${o.cls} [${o.left}~${o.right}]`));
  }
  if (smallTargets.length) {
    console.log(`  44px 미만 터치 대상 ${smallTargets.length}개:`);
    smallTargets.slice(0, 5).forEach((t) => console.log(`    "${t.text}" h=${t.h}px`));
  }

  await page.close();
}

await browser.close();
console.log(failed ? '\n=> 모바일 규칙 위반 있음' : '\n=> 모든 폭에서 통과');
process.exit(failed ? 1 : 0);
