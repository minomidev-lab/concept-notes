# 나만의 개념노트 — 1단계(뼈대와 열람) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초·중·고 개념을 트리로 탐색하고 연결 경로·수식·"나의 이해" 노트를 열람할 수 있는 Astro 정적 사이트를 만들어 GitHub Pages에 배포한다.

**Architecture:** GitHub 저장소 하나가 단일 진실 원천. `content/`의 마크다운(개념/노트)을 Astro 콘텐츠 컬렉션(glob 로더)으로 읽어 정적 페이지를 생성하고, push 시 GitHub Actions가 GitHub Pages로 자동 배포한다. 편집 기능·댓글은 2·3단계 범위이며 이 계획에 포함하지 않는다.

**Tech Stack:** Astro 6 (버전 고정 — Astro 7은 마크다운 플러그인 방식이 다름), remark-math + rehype-katex + KaTeX (수식), Vitest (유틸 단위 테스트), Playwright (스모크 테스트), GitHub Actions + GitHub Pages (배포).

**스펙:** `docs/superpowers/specs/2026-08-07-concept-notes-design.md` (1단계 범위)

**실행 환경 메모:**

- Windows에서 Bash 툴(git bash) 기준 명령으로 작성했다. 경로 구분은 `/`.
- 프로젝트 루트: `C:\minomi\code\study` (git 저장소 초기화 완료, `docs/`와 `.gitignore` 커밋 존재)
- Node 20 이상 필요 (`node --version`으로 확인).
- Task 10(배포)은 `gh` CLI 로그인(`gh auth status`)이 필요하다. 안 되어 있으면 그 시점에 사용자에게 알린다.
- 저장소/사이트 이름은 `concept-notes`로 한다 (base 경로 `/concept-notes`).

**파일 구조 (이 계획이 만드는 것):**

```
package.json, astro.config.mjs, tsconfig.json, playwright.config.ts
content/
  labels.json                                  # 폴더 slug → 한글 라벨
  math/elementary/patterns/rule-correspondence/concept.md
  math/middle/functions/linear-function/{concept.md, my-note.md}
  math/middle/functions/quadratic-function/concept.md
src/
  content.config.ts        # 콘텐츠 컬렉션 정의 (concepts, notes)
  lib/concepts.ts          # 트리 빌드 + prev/next 해석 (순수 함수 — 단위 테스트 대상)
  lib/url.ts               # base 경로 붙인 개념 URL 헬퍼
  layouts/BaseLayout.astro # 공통 레이아웃 (헤더·사이드바·반응형)
  components/Sidebar.astro # 과목→학교급→단원→개념 트리
  components/ConceptPath.astro # 초→중→고 연결 경로 표시
  pages/index.astro        # 홈
  pages/[...path].astro    # 개념 페이지
  styles/global.css
tests/concepts.test.ts     # Vitest
e2e/smoke.spec.ts          # Playwright
.github/workflows/deploy.yml
```

---

### Task 1: Astro 프로젝트 스캐폴드

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/pages/index.astro` (임시 — Task 8에서 교체)
- Modify: `.gitignore`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "concept-notes",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "e2e": "playwright test"
  },
  "dependencies": {
    "astro": "^6.3.1",
    "katex": "^0.16.22",
    "rehype-katex": "^7.0.1",
    "remark-math": "^6.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: astro.config.mjs 작성** (site는 Task 10에서 추가)

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  base: '/concept-notes',
});
```

- [ ] **Step 3: tsconfig.json 작성**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*", "tests/**/*", "e2e/**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: 임시 홈 페이지 작성** — `src/pages/index.astro`

```astro
---
---
<html lang="ko">
  <body>
    <h1>나만의 개념노트 — 준비 중</h1>
  </body>
</html>
```

- [ ] **Step 5: .gitignore에 Playwright 산출물 추가** — 기존 파일 끝에 아래 블록 추가

```
# Playwright
test-results/
playwright-report/
```

- [ ] **Step 6: 의존성 설치**

Run: `npm install`
Expected: 에러 없이 완료, `package-lock.json` 생성

- [ ] **Step 7: 빌드 확인**

Run: `npm run build`
Expected: `Complete!` 또는 `✓ Completed` 류의 성공 메시지, `dist/index.html` 생성

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/pages/index.astro .gitignore
git commit -m "feat: Astro 6 프로젝트 스캐폴드

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 콘텐츠 컬렉션 정의 + 수학 샘플 콘텐츠

**Files:**
- Create: `src/content.config.ts`
- Create: `content/labels.json`
- Create: `content/math/elementary/patterns/rule-correspondence/concept.md`
- Create: `content/math/middle/functions/linear-function/concept.md`
- Create: `content/math/middle/functions/linear-function/my-note.md`
- Create: `content/math/middle/functions/quadratic-function/concept.md`

- [ ] **Step 1: 콘텐츠 컬렉션 정의** — `src/content.config.ts`

개념 폴더 경로(예: `math/middle/functions/linear-function`)가 그대로 엔트리 `id`가 되도록 `generateId`로 파일명을 떼어낸다.

```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const concepts = defineCollection({
  loader: glob({
    pattern: '**/concept.md',
    base: './content',
    generateId: ({ entry }) => entry.replace(/\/concept\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    level: z.enum(['elementary', 'middle', 'high']),
    prev: z.array(z.string()).default([]),
    next: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

const notes = defineCollection({
  loader: glob({
    pattern: '**/my-note.md',
    base: './content',
    generateId: ({ entry }) => entry.replace(/\/my-note\.md$/, ''),
  }),
  schema: z.object({
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { concepts, notes };
```

- [ ] **Step 2: 라벨 파일 작성** — `content/labels.json`

폴더 slug → 한글 표시명. 새 단원을 추가할 때마다 여기에 라벨을 추가해야 하며, 빠뜨리면 빌드가 실패한다(Task 3의 `labelOf`).

```json
{
  "math": "수학",
  "science": "과학",
  "korean": "국어",
  "english": "영어",
  "elementary": "초등",
  "middle": "중등",
  "high": "고등",
  "patterns": "규칙과 대응",
  "functions": "함수"
}
```

- [ ] **Step 3: 개념 3개 + 노트 1개 작성**

`content/math/elementary/patterns/rule-correspondence/concept.md`:

```md
---
title: 규칙과 대응
level: elementary
order: 1
next:
  - math/middle/functions/linear-function
---

## 핵심 아이디어

한 양이 변할 때 다른 양이 **일정한 규칙**에 따라 함께 변하는 관계를 찾는다.

| 사각형 수 | 1 | 2 | 3 | 4 |
|-----------|---|---|---|---|
| 성냥개비 수 | 4 | 7 | 10 | 13 |

사각형이 1개 늘 때마다 성냥개비는 3개씩 늘어난다. 이 "대응 관계"가 중학교 **함수** 개념의 씨앗이 된다.
```

`content/math/middle/functions/linear-function/concept.md`:

```md
---
title: 일차함수
level: middle
order: 1
prev:
  - math/elementary/patterns/rule-correspondence
next:
  - math/middle/functions/quadratic-function
---

## 정의

$y = ax + b$ ($a \neq 0$) 꼴로 나타낼 수 있는 함수를 **일차함수**라고 한다.

## 핵심 요소

- **기울기 $a$**: $x$가 1만큼 변할 때 $y$가 변하는 양. $a = \dfrac{y\text{의 증가량}}{x\text{의 증가량}}$
- **$y$절편 $b$**: 그래프가 $y$축과 만나는 점의 $y$좌표.

## 그래프

일차함수의 그래프는 직선이다. $a > 0$이면 오른쪽 위로, $a < 0$이면 오른쪽 아래로 향한다.
```

`content/math/middle/functions/linear-function/my-note.md`:

```md
---
updated: 2026-08-08
---

기울기 $a$는 결국 **변화 속도**다. 시속 60km로 달리는 자동차의 거리 그래프를 그리면 기울기가 60인 직선이 된다. "기울기 = 얼마나 빨리 변하는가"로 기억하자.
```

`content/math/middle/functions/quadratic-function/concept.md`:

```md
---
title: 이차함수
level: middle
order: 2
prev:
  - math/middle/functions/linear-function
---

## 정의

$y = ax^2 + bx + c$ ($a \neq 0$) 꼴로 나타낼 수 있는 함수를 **이차함수**라고 한다.

## 그래프

이차함수의 그래프는 **포물선**이다. $a > 0$이면 아래로 볼록, $a < 0$이면 위로 볼록하다.
```

- [ ] **Step 4: 빌드로 스키마 검증**

Run: `npm run build`
Expected: 성공. (frontmatter가 스키마와 어긋나면 여기서 zod 에러가 난다 — 스펙 §9의 "frontmatter 필수 필드 검사"가 이 층에서 동작)

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts content/
git commit -m "feat: 콘텐츠 컬렉션 정의 및 수학 샘플 콘텐츠 3건

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 트리 빌드 + 연결 해석 유틸 (TDD)

**Files:**
- Create: `src/lib/concepts.ts`
- Test: `tests/concepts.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/concepts.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { buildTree, resolveRefs, type ConceptLeaf } from '../src/lib/concepts';

const labels: Record<string, string> = {
  math: '수학', science: '과학',
  elementary: '초등', middle: '중등',
  patterns: '규칙과 대응', functions: '함수',
};

const leaves: ConceptLeaf[] = [
  { path: 'math/middle/functions/quadratic-function', title: '이차함수', order: 2 },
  { path: 'math/middle/functions/linear-function', title: '일차함수', order: 1 },
  { path: 'math/elementary/patterns/rule-correspondence', title: '규칙과 대응', order: 1 },
];

describe('buildTree', () => {
  it('과목→학교급→단원→개념으로 묶고 한글 라벨을 붙인다', () => {
    const tree = buildTree(leaves, labels);
    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('math');
    expect(tree[0].label).toBe('수학');
    const levelSlugs = tree[0].levels.map((l) => l.slug);
    expect(levelSlugs).toEqual(['elementary', 'middle']); // 초→중→고 고정 순서
    const functionsUnit = tree[0].levels[1].units[0];
    expect(functionsUnit.label).toBe('함수');
    expect(functionsUnit.concepts.map((c) => c.title)).toEqual(['일차함수', '이차함수']); // order 순 정렬
  });

  it('4단계가 아닌 경로는 에러', () => {
    expect(() => buildTree([{ path: 'math/middle/linear-function', title: 'x', order: 0 }], labels))
      .toThrow(/4단계/);
  });

  it('라벨이 없는 slug는 에러', () => {
    expect(() => buildTree([{ path: 'math/middle/geometry/triangle', title: '삼각형', order: 0 }], labels))
      .toThrow(/geometry/);
  });
});

describe('resolveRefs', () => {
  const lookup = new Map([
    ['math/middle/functions/linear-function', { title: '일차함수', level: 'middle' as const }],
  ]);

  it('경로를 제목·학교급으로 해석한다', () => {
    const refs = resolveRefs(['math/middle/functions/linear-function'], lookup, 'from-id');
    expect(refs).toEqual([
      { path: 'math/middle/functions/linear-function', title: '일차함수', level: 'middle' },
    ]);
  });

  it('없는 개념을 가리키면 출처와 대상이 담긴 에러', () => {
    expect(() => resolveRefs(['math/high/calculus/limit'], lookup, 'from-id'))
      .toThrow(/from-id.*math\/high\/calculus\/limit/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run`
Expected: FAIL — `Cannot find module '../src/lib/concepts'` 류의 에러

- [ ] **Step 3: 구현** — `src/lib/concepts.ts`

```ts
export type Level = 'elementary' | 'middle' | 'high';

export interface ConceptLeaf {
  /** 개념 폴더 경로 = 컬렉션 엔트리 id. 예: 'math/middle/functions/linear-function' */
  path: string;
  title: string;
  order: number;
}

export interface UnitNode { slug: string; label: string; concepts: ConceptLeaf[] }
export interface LevelNode { slug: Level; label: string; units: UnitNode[] }
export interface SubjectNode { slug: string; label: string; levels: LevelNode[] }

export interface ConceptRef { path: string; title: string; level: Level }

const SUBJECT_ORDER = ['math', 'science', 'korean', 'english'];
const LEVEL_ORDER: Level[] = ['elementary', 'middle', 'high'];

function labelOf(slug: string, labels: Record<string, string>): string {
  const label = labels[slug];
  if (!label) throw new Error(`content/labels.json에 '${slug}' 라벨이 없습니다.`);
  return label;
}

export function buildTree(leaves: ConceptLeaf[], labels: Record<string, string>): SubjectNode[] {
  // subject → level → unit → leaves 중첩 그룹핑
  const grouped = new Map<string, Map<Level, Map<string, ConceptLeaf[]>>>();

  for (const leaf of leaves) {
    const parts = leaf.path.split('/');
    if (parts.length !== 4) {
      throw new Error(`잘못된 개념 경로 '${leaf.path}': 과목/학교급/단원/개념의 4단계여야 합니다.`);
    }
    const [subject, level, unit] = parts;
    if (!SUBJECT_ORDER.includes(subject)) {
      throw new Error(`알 수 없는 과목 '${subject}' (${leaf.path})`);
    }
    if (!LEVEL_ORDER.includes(level as Level)) {
      throw new Error(`알 수 없는 학교급 '${level}' (${leaf.path})`);
    }
    const levelsMap = grouped.get(subject) ?? new Map<Level, Map<string, ConceptLeaf[]>>();
    const unitsMap = levelsMap.get(level as Level) ?? new Map<string, ConceptLeaf[]>();
    const unitLeaves = unitsMap.get(unit) ?? [];
    unitLeaves.push(leaf);
    unitsMap.set(unit, unitLeaves);
    levelsMap.set(level as Level, unitsMap);
    grouped.set(subject, levelsMap);
  }

  return SUBJECT_ORDER.filter((s) => grouped.has(s)).map((subject) => ({
    slug: subject,
    label: labelOf(subject, labels),
    levels: LEVEL_ORDER.filter((l) => grouped.get(subject)!.has(l)).map((level) => ({
      slug: level,
      label: labelOf(level, labels),
      units: [...grouped.get(subject)!.get(level)!.entries()].map(([unitSlug, unitLeaves]) => ({
        slug: unitSlug,
        label: labelOf(unitSlug, labels),
        concepts: [...unitLeaves].sort(
          (a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ko'),
        ),
      })),
    })),
  }));
}

export function resolveRefs(
  paths: string[],
  lookup: Map<string, { title: string; level: Level }>,
  fromId: string,
): ConceptRef[] {
  return paths.map((path) => {
    const hit = lookup.get(path);
    if (!hit) {
      throw new Error(`'${fromId}'의 prev/next가 가리키는 '${path}'을(를) 찾을 수 없습니다.`);
    }
    return { path, title: hit.title, level: hit.level };
  });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run`
Expected: PASS — 5개 테스트 모두 통과

- [ ] **Step 5: Commit**

```bash
git add src/lib/concepts.ts tests/concepts.test.ts
git commit -m "feat: 개념 트리 빌드·연결 해석 유틸 (테스트 포함)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: URL 헬퍼 + 전역 스타일

**Files:**
- Create: `src/lib/url.ts`
- Create: `src/styles/global.css`

- [ ] **Step 1: URL 헬퍼 작성** — `src/lib/url.ts`

`base` 설정('/concept-notes')이 붙은 개념 페이지 URL을 만든다. Astro의 `BASE_URL`은 후행 슬래시 유무가 환경에 따라 다르므로 정규화한다.

```ts
export function conceptUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/${path}/`;
}
```

- [ ] **Step 2: 전역 스타일 작성** — `src/styles/global.css`

태블릿(좁은 화면)에서는 사이드바가 오프캔버스로 숨고 ☰ 버튼으로 연다.

```css
* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif;
  line-height: 1.7;
  color: #1f2328;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #d0d7de;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
}

#menu-toggle {
  font-size: 20px;
  background: none;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
}

.home-link { text-decoration: none; color: inherit; font-weight: 700; }

.shell { display: flex; min-height: calc(100vh - 49px); }

#sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #d0d7de;
  padding: 16px;
  overflow-y: auto;
}

#sidebar summary { cursor: pointer; padding: 4px 0; font-weight: 600; }
#sidebar details details { margin-left: 12px; }
#sidebar ul { list-style: none; margin: 4px 0; padding-left: 16px; }
#sidebar a { text-decoration: none; color: #0969da; display: block; padding: 4px 0; }
#sidebar a.current { font-weight: 700; color: #1f2328; }

main { flex: 1; padding: 24px; max-width: 860px; }

.concept-path {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 20px;
}
.concept-path a { color: #0969da; text-decoration: none; }

.my-note {
  border-left: 4px solid #e9739a;
  background: #fff5f8;
  border-radius: 0 8px 8px 0;
  padding: 4px 20px 12px;
  margin-top: 32px;
}
.my-note .empty { color: #77808a; }

table { border-collapse: collapse; }
th, td { border: 1px solid #d0d7de; padding: 6px 12px; }

/* 좁은 화면(태블릿 세로·모바일): 사이드바 오프캔버스 */
@media (max-width: 899px) {
  #sidebar {
    position: fixed;
    top: 49px;
    left: 0;
    bottom: 0;
    background: #fff;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 20;
  }
  body.sidebar-open #sidebar { transform: translateX(0); box-shadow: 4px 0 16px rgba(0,0,0,0.15); }
}

/* 넓은 화면: 사이드바 상시 표시, 토글 버튼 숨김 */
@media (min-width: 900px) {
  #menu-toggle { display: none; }
}
```

- [ ] **Step 3: Commit** (아직 아무 페이지도 이 파일들을 쓰지 않지만, 다음 태스크가 의존하므로 독립 커밋)

```bash
git add src/lib/url.ts src/styles/global.css
git commit -m "feat: URL 헬퍼와 반응형 전역 스타일

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 공통 레이아웃 + 사이드바 트리

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Sidebar.astro`

- [ ] **Step 1: 사이드바 컴포넌트 작성** — `src/components/Sidebar.astro`

현재 개념이 속한 가지(`<details>`)만 펼친 채로 렌더링한다.

```astro
---
import type { SubjectNode } from '../lib/concepts';
import { conceptUrl } from '../lib/url';

interface Props { tree: SubjectNode[]; currentPath?: string }
const { tree, currentPath } = Astro.props;
const contains = (prefix: string) => !!currentPath && currentPath.startsWith(prefix);
---
<nav aria-label="개념 탐색">
  {tree.map((subject) => (
    <details open={contains(`${subject.slug}/`)}>
      <summary>{subject.label}</summary>
      {subject.levels.map((level) => (
        <details open={contains(`${subject.slug}/${level.slug}/`)}>
          <summary>{level.label}</summary>
          {level.units.map((unit) => (
            <details open={contains(`${subject.slug}/${level.slug}/${unit.slug}/`)}>
              <summary>{unit.label}</summary>
              <ul>
                {unit.concepts.map((c) => (
                  <li>
                    <a class={c.path === currentPath ? 'current' : undefined} href={conceptUrl(c.path)}>
                      {c.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </details>
      ))}
    </details>
  ))}
</nav>
```

- [ ] **Step 2: 공통 레이아웃 작성** — `src/layouts/BaseLayout.astro`

```astro
---
import '../styles/global.css';
import 'katex/dist/katex.min.css';
import { getCollection } from 'astro:content';
import Sidebar from '../components/Sidebar.astro';
import { buildTree } from '../lib/concepts';
import labels from '../../content/labels.json';

interface Props { title: string; currentPath?: string }
const { title, currentPath } = Astro.props;

const concepts = await getCollection('concepts');
const tree = buildTree(
  concepts.map((c) => ({ path: c.id, title: c.data.title, order: c.data.order })),
  labels,
);
---
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} · 나만의 개념노트</title>
  </head>
  <body>
    <header class="topbar">
      <button id="menu-toggle" aria-label="메뉴 열기">☰</button>
      <a class="home-link" href={import.meta.env.BASE_URL}>📚 나만의 개념노트</a>
    </header>
    <div class="shell">
      <aside id="sidebar">
        <Sidebar tree={tree} currentPath={currentPath} />
      </aside>
      <main><slot /></main>
    </div>
    <script>
      document.getElementById('menu-toggle')!.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
      });
    </script>
  </body>
</html>
```

- [ ] **Step 3: 빌드 확인** (레이아웃은 아직 어느 페이지에서도 안 쓰므로 컴파일 에러만 검출)

Run: `npm run build`
Expected: 성공

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/Sidebar.astro
git commit -m "feat: 공통 레이아웃과 사이드바 트리 컴포넌트

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 개념 페이지 라우트 + 연결 경로

**Files:**
- Create: `src/components/ConceptPath.astro`
- Create: `src/pages/[...path].astro`

- [ ] **Step 1: 연결 경로 컴포넌트 작성** — `src/components/ConceptPath.astro`

```astro
---
import type { ConceptRef } from '../lib/concepts';
import { conceptUrl } from '../lib/url';
import labelsJson from '../../content/labels.json';

interface Props { title: string; prev: ConceptRef[]; next: ConceptRef[] }
const { title, prev, next } = Astro.props;
const labels = labelsJson as Record<string, string>;
const short = (r: ConceptRef) => `${r.title}(${labels[r.level]})`;
---
<nav class="concept-path" aria-label="개념 연결 경로">
  {prev.map((r) => <a href={conceptUrl(r.path)}>{short(r)}</a>)}
  {prev.length > 0 && <span>←</span>}
  <strong>{title}</strong>
  {next.length > 0 && <span>→</span>}
  {next.map((r) => <a href={conceptUrl(r.path)}>{short(r)}</a>)}
</nav>
```

- [ ] **Step 2: 개념 페이지 라우트 작성** — `src/pages/[...path].astro`

`getStaticPaths`에서 두 가지를 빌드 시점에 검증한다(스펙 §9): ① frontmatter `level`과 폴더 학교급 일치, ② prev/next 링크 유효성(`resolveRefs`가 throw).

```astro
---
import { getCollection, getEntry, render } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import ConceptPath from '../components/ConceptPath.astro';
import { resolveRefs } from '../lib/concepts';

export async function getStaticPaths() {
  const concepts = await getCollection('concepts');
  for (const c of concepts) {
    const folderLevel = c.id.split('/')[1];
    if (c.data.level !== folderLevel) {
      throw new Error(
        `'${c.id}'의 frontmatter level('${c.data.level}')이 폴더 학교급('${folderLevel}')과 다릅니다.`,
      );
    }
  }
  return concepts.map((concept) => ({ params: { path: concept.id }, props: { concept } }));
}

const { concept } = Astro.props;

const all = await getCollection('concepts');
const lookup = new Map(all.map((c) => [c.id, { title: c.data.title, level: c.data.level }]));
const prev = resolveRefs(concept.data.prev, lookup, concept.id);
const next = resolveRefs(concept.data.next, lookup, concept.id);

const note = await getEntry('notes', concept.id);
const { Content } = await render(concept);
const noteRendered = note ? await render(note) : null;
const NoteContent = noteRendered?.Content;
---
<BaseLayout title={concept.data.title} currentPath={concept.id}>
  <ConceptPath title={concept.data.title} prev={prev} next={next} />
  <article class="concept">
    <h1>{concept.data.title}</h1>
    <Content />
  </article>
  <section class="my-note">
    <h2>✏️ 나의 이해</h2>
    {NoteContent ? <NoteContent /> : <p class="empty">아직 작성한 노트가 없습니다.</p>}
  </section>
</BaseLayout>
```

- [ ] **Step 3: 빌드 후 산출물 확인**

Run: `npm run build && ls dist/math/middle/functions/linear-function/`
Expected: 빌드 성공, `index.html` 존재

Run: `grep -o "나의 이해" dist/math/middle/functions/linear-function/index.html | head -1`
Expected: `나의 이해`

Run: `grep -o "규칙과 대응(초등)" dist/math/middle/functions/linear-function/index.html | head -1`
Expected: `규칙과 대응(초등)` (연결 경로가 렌더링됨)

- [ ] **Step 4: 링크 검증이 실제로 동작하는지 확인** — `content/math/middle/functions/quadratic-function/concept.md`의 `prev`를 일부러 `math/high/calculus/limit`로 바꾸고:

Run: `npm run build`
Expected: FAIL — "'math/middle/functions/quadratic-function'의 prev/next가 가리키는 'math/high/calculus/limit'을(를) 찾을 수 없습니다." 포함 에러

확인 후 원래 값(`math/middle/functions/linear-function`)으로 되돌리고 `npm run build`가 다시 성공하는지 확인.

- [ ] **Step 5: Commit**

```bash
git add src/components/ConceptPath.astro "src/pages/[...path].astro"
git commit -m "feat: 개념 페이지 라우트, 연결 경로, 빌드 시 링크 검증

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: KaTeX 수식 렌더링

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: 마크다운 플러그인 설정** — `astro.config.mjs` 전체를 아래로 교체

```js
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  base: '/concept-notes',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
```

(KaTeX CSS는 Task 5의 BaseLayout에서 이미 import 했다.)

- [ ] **Step 2: 수식이 조판되는지 확인**

Run: `npm run build && grep -c "katex" dist/math/middle/functions/linear-function/index.html`
Expected: 1 이상의 숫자 (KaTeX 마크업이 들어감. `$y = ax + b$`가 원문 그대로면 실패)

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: remark-math + rehype-katex 수식 렌더링

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: 홈 페이지

**Files:**
- Modify: `src/pages/index.astro` (Task 1의 임시 내용 전체 교체)

- [ ] **Step 1: 홈 페이지 작성** — `src/pages/index.astro`

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import { buildTree } from '../lib/concepts';
import { conceptUrl } from '../lib/url';
import labels from '../../content/labels.json';

const concepts = await getCollection('concepts');
const tree = buildTree(
  concepts.map((c) => ({ path: c.id, title: c.data.title, order: c.data.order })),
  labels,
);
---
<BaseLayout title="홈">
  <h1>📚 나만의 개념노트</h1>
  <p>초·중·고 개념을 연결하며 쌓아가는 학습 노트입니다. 왼쪽 트리나 아래 목록에서 개념을 골라보세요.</p>
  {tree.map((subject) => (
    <section>
      <h2>{subject.label}</h2>
      {subject.levels.map((level) => (
        <div>
          <h3>{level.label}</h3>
          <ul>
            {level.units.flatMap((u) => u.concepts).map((c) => (
              <li><a href={conceptUrl(c.path)}>{c.title}</a></li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  ))}
</BaseLayout>
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build && grep -o "일차함수" dist/index.html | head -1`
Expected: `일차함수`

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: 홈 페이지 — 과목별 개념 목록

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Playwright 스모크 테스트

**Files:**
- Create: `playwright.config.ts`
- Test: `e2e/smoke.spec.ts`

- [ ] **Step 1: Chromium 설치**

Run: `npx playwright install chromium`
Expected: 다운로드 완료 (이미 있으면 즉시 종료)

- [ ] **Step 2: Playwright 설정** — `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4321/concept-notes/' },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321/concept-notes/',
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 3: 스모크 테스트 작성** — `e2e/smoke.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('홈에서 개념 목록이 보인다', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '📚 나만의 개념노트' })).toBeVisible();
  await expect(page.getByRole('link', { name: '일차함수' }).first()).toBeVisible();
});

test('개념 페이지: 본문·연결 경로·나의 이해가 렌더링된다', async ({ page }) => {
  await page.goto('math/middle/functions/linear-function/');
  await expect(page.getByRole('heading', { level: 1, name: '일차함수' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: '개념 연결 경로' })).toContainText('규칙과 대응(초등)');
  await expect(page.getByRole('heading', { name: '✏️ 나의 이해' })).toBeVisible();
  // KaTeX 조판 확인: 원문 '$y = ax + b$'가 그대로 노출되면 안 된다
  await expect(page.locator('.katex').first()).toBeVisible();
});

test('태블릿 세로 화면: 사이드바가 ☰ 버튼으로 열린다', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('math/middle/functions/linear-function/');
  const sidebarLink = page.locator('#sidebar').getByRole('link', { name: '이차함수' });
  await expect(sidebarLink).not.toBeInViewport();
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(sidebarLink).toBeInViewport();
});
```

- [ ] **Step 4: 빌드 후 테스트 실행**

Run: `npm run build && npx playwright test`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e/smoke.spec.ts
git commit -m "test: 열람 흐름 Playwright 스모크 테스트 3건

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: GitHub 저장소 생성 + Pages 자동 배포

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `astro.config.mjs` (site 추가)

- [ ] **Step 1: gh CLI 로그인 확인**

Run: `gh auth status`
Expected: `Logged in to github.com` 포함. **실패하면 여기서 멈추고 사용자에게 `gh auth login` 실행을 요청한다.**

- [ ] **Step 2: GitHub 사용자명 확인 후 site 설정** — 사용자명 조회:

Run: `gh api user -q .login`
Expected: GitHub 사용자명 출력 (아래에서 `<USERNAME>` 자리에 사용)

`astro.config.mjs`의 `defineConfig` 객체에 `site` 한 줄 추가 (**`<USERNAME>`을 실제 값으로 치환**):

```js
export default defineConfig({
  site: 'https://<USERNAME>.github.io',
  base: '/concept-notes',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
```

- [ ] **Step 3: 배포 워크플로 작성** — `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Install, build, and upload site
        uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/deploy.yml astro.config.mjs
git commit -m "ci: GitHub Pages 자동 배포 워크플로

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: 저장소 생성 + push** (🟠 주의: 공개 저장소가 만들어지고 코드가 GitHub에 올라간다 — 스펙에서 "전체 공개"로 승인된 사항)

Run: `gh repo create concept-notes --public --source . --push`
Expected: 저장소 생성 및 `main` push 완료

- [ ] **Step 6: Pages 소스를 GitHub Actions로 설정**

Run: `gh api -X POST "repos/{owner}/concept-notes/pages" -f build_type=workflow`
Expected: JSON 응답 (이미 설정돼 있으면 409 — 무시 가능). 409 외 에러 시: GitHub 저장소 Settings → Pages → Source를 "GitHub Actions"로 수동 설정하도록 사용자에게 안내.

첫 push가 Step 6보다 먼저 워크플로를 실행해 실패했을 수 있으므로 재실행:

Run: `gh workflow run deploy.yml && sleep 10 && gh run list --workflow deploy.yml --limit 1`
Expected: 새 run이 `queued` 또는 `in_progress`

- [ ] **Step 7: 배포 확인**

Run: `gh run watch $(gh run list --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId') --exit-status`
Expected: 성공 종료

Run: `curl -s -o /dev/null -w "%{http_code}" https://<USERNAME>.github.io/concept-notes/`
Expected: `200`

사이트 접속 URL을 사용자에게 보고한다: `https://<USERNAME>.github.io/concept-notes/`

---

## 완료 기준 (1단계 성공 검증)

- [ ] `npm run test` — Vitest 5건 통과
- [ ] `npm run build` — 빌드 성공 (frontmatter·링크 검증 포함)
- [ ] `npx playwright test` — 스모크 3건 통과 (열람·연결 경로·수식·태블릿 반응형)
- [ ] `https://<USERNAME>.github.io/concept-notes/` 에서 홈과 일차함수 페이지가 열림
- [ ] 스펙 1단계 범위 밖 기능(편집·스케치·댓글·책)은 만들지 않았음

## 다음 단계 메모

- 2단계(나의 편집): fine-grained PAT 인증 + 마크다운 에디터 + 스케치 캔버스 — 별도 스펙·계획으로 진행
- `my-note.md`의 스케치 이미지 삽입은 2단계에서 `sketches/` 저장 방식과 함께 설계
- 콘텐츠 확장(4과목, Claude 초안 생성)은 3단계
