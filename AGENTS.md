<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Movin 프로젝트 규칙

## 모바일 우선 (필수)

이 서비스는 **출퇴근길 대중교통에서 한 손으로 쓰는 것**이 기획의 전제다.
데스크톱은 부차적이다. UI 를 만들거나 고칠 때 매번 아래를 지킬 것.

### 기준 뷰포트
- **375px (iPhone SE/13 mini)** 에서 깨지지 않는 것이 최소 기준이다.
- 검증은 375 / 390 / 430 폭에서 한다. 데스크톱만 보고 "됐다" 하지 말 것.
- 가로 스크롤은 어떤 경우에도 발생하면 안 된다.

### 레이아웃
- **모바일 기본 → 큰 화면에 `md:`/`lg:` 추가** 순서로 쓴다.
  `md:` 를 모바일 축소용으로 쓰지 않는다.
- 그리드는 모바일에서 **1열**이 기본이다. (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- 카드 패딩은 모바일에서 줄인다. 데스크톱 40px 이면 모바일은 20~24px.
- 고정 `width` 금지. `max-width` + `w-full` 을 쓴다.

### 터치 대상
- 버튼·링크의 터치 영역은 **최소 44x44px**. 흔들리는 차 안에서 눌러야 한다.
- 인접한 터치 대상 사이 간격 최소 8px.
- hover 에만 의존하는 UI 금지 — 터치 기기엔 hover 가 없다.

### 타이포
- 본문은 모바일에서 **14px 미만으로 내리지 않는다.**
- 큰 헤드라인은 반드시 반응형으로: `text-[32px] md:text-[56px]` 형태.
  56px 를 모바일에 그대로 쓰면 두세 단어에서 줄바꿈이 터진다.
- 긴 한글 제목은 `break-keep` 으로 어절 단위 줄바꿈을 유지한다.

### 이 프로젝트 특유의 것
- 브리핑 카드가 핵심 화면이다. **카드 하나가 모바일 한 화면에 들어와야** 한다.
- 하드 오프셋 그림자(`-6px 6px`)는 모바일에서 화면 밖으로 넘칠 수 있다.
  카드 컨테이너에 좌우 여백을 충분히 두거나 그림자를 줄인다.
- 마퀴 배너는 모바일에서도 가로 스크롤을 유발하지 않도록 `overflow-hidden` 유지.

### 확인 방법
UI 를 바꿨으면 데스크톱만 보지 말고 모바일 폭에서도 확인한 뒤 보고할 것.
