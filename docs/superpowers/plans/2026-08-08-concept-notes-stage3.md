# 나만의 개념노트 — 3단계(소통·콘텐츠 확장) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 개념 페이지에 giscus(GitHub Discussions) 댓글을 붙이고, 과학·국어·영어에 초→중→고 연결 사슬을 갖춘 시드 콘텐츠와 수학 고등 개념 1건을 추가한다.

**Architecture:** 댓글은 giscus 클라이언트 스크립트를 개념 페이지에 임베드 — 데이터는 저장소 Discussions에 저장되므로 서버·DB 불필요. 콘텐츠는 1단계에서 만든 구조 그대로(개념 폴더 + frontmatter prev/next)이며, 빌드 시 링크·라벨 검증이 오류를 잡아준다. 과목별 커밋으로 나눠 진행한다.

**Tech Stack:** 기존 스택 + giscus (외부 스크립트, 의존성 추가 없음). giscus GitHub App 설치는 사용자 1클릭 액션(마지막 태스크에서 안내).

**스펙:** `docs/superpowers/specs/2026-08-07-concept-notes-design.md` §7 댓글, §2 과목 범위 (3단계)

**실행 환경 메모:**

- 기준선(2단계 완료): Vitest 22건, Playwright 8건, 빌드 4쪽.
- 브랜치 `feature/stage3-comments-content`에서 작업, 마지막에 main 병합·배포.
- giscus 작동 조건: ① 공개 저장소 ✓ ② Discussions 활성화(Task 5에서 API로) ③ giscus 앱 설치(**사용자 액션** — Task 6에서 안내). ③ 전까지 댓글 위젯은 "설치 필요" 안내를 표시하지만 사이트는 정상 동작한다.

**파일 구조:**

```
content/labels.json                          # 수정: 단원 라벨 4개 추가
content/science/elementary/forces/weight-and-force/concept.md
content/science/middle/forces/force-and-motion/concept.md
content/science/high/mechanics/newtons-laws/concept.md
content/korean/elementary/grammar/sentence-structure/concept.md
content/korean/middle/grammar/sentence-components/concept.md
content/korean/high/grammar/grammar-elements/concept.md
content/english/elementary/grammar/words-and-sentences/concept.md
content/english/middle/grammar/sentence-patterns/concept.md
content/english/high/grammar/relative-clauses/concept.md
content/math/high/calculus/limits/concept.md
content/math/middle/functions/quadratic-function/concept.md  # 수정: next에 limits 추가
src/components/Comments.astro                # 새 giscus 컴포넌트
src/pages/[...path].astro                    # 수정: Comments 포함
src/styles/global.css                        # 수정: 댓글 섹션 여백
e2e/smoke.spec.ts                            # 수정: 4과목·댓글 섹션 테스트 2건 추가
```

---

### Task 0: 작업 브랜치 생성

- [ ] **Step 1:**

```bash
git checkout -b feature/stage3-comments-content
```

Run: `git branch --show-current`
Expected: `feature/stage3-comments-content`

---

### Task 1: 라벨 + 과학 콘텐츠 (초→중→고 사슬)

**Files:**
- Modify: `content/labels.json`
- Create: `content/science/elementary/forces/weight-and-force/concept.md`
- Create: `content/science/middle/forces/force-and-motion/concept.md`
- Create: `content/science/high/mechanics/newtons-laws/concept.md`

- [ ] **Step 1: labels.json에 단원 라벨 4개 추가** — 전체를 아래로 교체 (이번 단계에서 쓸 라벨을 한꺼번에 추가)

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
  "functions": "함수",
  "forces": "힘과 운동",
  "mechanics": "역학",
  "grammar": "문법",
  "calculus": "미적분"
}
```

- [ ] **Step 2: 과학 개념 3개 작성**

`content/science/elementary/forces/weight-and-force/concept.md`:

```md
---
title: 무게와 힘
level: elementary
order: 1
next:
  - science/middle/forces/force-and-motion
---

## 핵심 아이디어

물체를 밀거나 당기는 것을 **힘**이라고 한다. 힘을 주면 물체의 모양이 변하거나 움직임이 달라진다.

**무게**는 지구가 물체를 끌어당기는 힘의 크기다. 그래서 무게는 용수철저울로 잰다 — 무거운 물체일수록 용수철이 많이 늘어난다.

## 생활 속 예

- 문을 밀어서 열기, 서랍을 당겨서 열기 → 힘
- 몸무게를 재는 저울 → 지구가 나를 당기는 힘을 재는 것

이 "당기는 힘" 개념이 중학교의 **힘과 운동**, 고등학교의 **뉴턴 운동 법칙**으로 이어진다.
```

`content/science/middle/forces/force-and-motion/concept.md`:

```md
---
title: 힘과 운동
level: middle
order: 1
prev:
  - science/elementary/forces/weight-and-force
next:
  - science/high/mechanics/newtons-laws
---

## 힘의 표현

힘은 **크기**와 **방향**을 함께 가진다. 화살표로 나타내며, 단위는 뉴턴(N)이다.

## 속력

물체가 얼마나 빨리 움직이는지는 **속력**으로 나타낸다.

$$v = \dfrac{s}{t} \quad (v: \text{속력},\ s: \text{이동 거리},\ t: \text{걸린 시간})$$

## 힘과 운동의 관계

- 힘이 **작용하지 않으면**: 정지한 물체는 계속 정지, 움직이는 물체는 같은 속력 유지 (등속 운동)
- 힘이 **작용하면**: 속력이나 방향이 변한다

"힘이 운동 상태를 바꾼다"는 이 관찰이 고등학교에서 $F = ma$라는 식으로 정리된다.
```

`content/science/high/mechanics/newtons-laws/concept.md`:

```md
---
title: 뉴턴 운동 법칙
level: high
order: 1
prev:
  - science/middle/forces/force-and-motion
---

## 제1법칙 — 관성

외부에서 힘이 작용하지 않으면 물체는 운동 상태를 유지한다. 버스가 급정거할 때 몸이 앞으로 쏠리는 이유다.

## 제2법칙 — 가속도

물체의 가속도는 힘에 비례하고 질량에 반비례한다.

$$F = ma$$

같은 힘이라도 질량이 크면 덜 가속되고, 같은 질량이라도 힘이 크면 더 가속된다.

## 제3법칙 — 작용·반작용

A가 B에 힘을 가하면, B도 A에 크기가 같고 방향이 반대인 힘을 가한다. 로켓이 가스를 아래로 뿜으며 위로 솟는 원리다.
```

- [ ] **Step 3: 빌드 검증** (라벨·링크 검증 포함)

Run: `npm run build`
Expected: 성공, **7 page(s) built** (기존 4 + 과학 3)

- [ ] **Step 4: Commit**

```bash
git add content/labels.json content/science/
git commit -m "content: 과학 시드 개념 3건 (무게와 힘 → 힘과 운동 → 뉴턴 운동 법칙)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 국어 콘텐츠 (초→중→고 사슬)

**Files:**
- Create: `content/korean/elementary/grammar/sentence-structure/concept.md`
- Create: `content/korean/middle/grammar/sentence-components/concept.md`
- Create: `content/korean/high/grammar/grammar-elements/concept.md`

- [ ] **Step 1: 국어 개념 3개 작성**

`content/korean/elementary/grammar/sentence-structure/concept.md`:

```md
---
title: 문장의 짜임
level: elementary
order: 1
next:
  - korean/middle/grammar/sentence-components
---

## 핵심 아이디어

문장은 크게 **"누가/무엇이"** 부분과 **"어찌하다/어떠하다"** 부분으로 나뉜다.

| 누가/무엇이 | 어찌하다/어떠하다 |
|-------------|-------------------|
| 강아지가 | 달린다 |
| 하늘이 | 파랗다 |

## 문장 나누어 보기

"동생이 사과를 먹는다"에서 "누가"는 *동생이*, "어찌하다"는 *사과를 먹는다*이다. 이렇게 문장을 부분으로 나누어 보는 습관이 중학교 **문장 성분** 공부의 기초가 된다.
```

`content/korean/middle/grammar/sentence-components/concept.md`:

```md
---
title: 문장 성분
level: middle
order: 1
prev:
  - korean/elementary/grammar/sentence-structure
next:
  - korean/high/grammar/grammar-elements
---

## 주성분

문장을 이루는 데 꼭 필요한 성분이다.

- **주어**: 동작·상태의 주체 — *동생이* 먹는다
- **서술어**: 주어를 풀이 — 동생이 *먹는다*
- **목적어**: 동작의 대상 — 사과*를* 먹는다
- **보어**: '되다/아니다' 앞을 채움 — 물이 얼음*이* 되다

## 부속 성분

- **관형어**: 체언 수식 — *빨간* 사과
- **부사어**: 용언 수식 — *빨리* 먹는다

초등 때 "누가/어찌하다"로 나눴던 것을 이제 성분 이름으로 정확히 부르는 것이다. 고등학교에서는 이 성분들에 **높임·시제** 같은 문법 요소가 어떻게 얹히는지 배운다.
```

`content/korean/high/grammar/grammar-elements/concept.md`:

```md
---
title: 문법 요소
level: high
order: 1
prev:
  - korean/middle/grammar/sentence-components
---

## 높임 표현

- 주체 높임: 선생님께서 오**시**다
- 객체 높임: 할머니를 **모시고** 가다
- 상대 높임: 종결 어미로 듣는 이를 높임 — 갑니다 / 가요 / 가

## 시제

- 과거: 먹**었**다 · 현재: 먹**는**다 · 미래: 먹**겠**다

## 피동과 사동

- 피동(당함): 쥐가 고양이에게 **잡히다**
- 사동(시킴): 엄마가 아이에게 옷을 **입히다**

문장 성분이라는 뼈대 위에 이런 문법 요소가 얹혀 화자의 의도·관계·시간이 표현된다.
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: 성공, **10 page(s) built**

- [ ] **Step 3: Commit**

```bash
git add content/korean/
git commit -m "content: 국어 시드 개념 3건 (문장의 짜임 → 문장 성분 → 문법 요소)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 영어 콘텐츠 (초→중→고 사슬)

**Files:**
- Create: `content/english/elementary/grammar/words-and-sentences/concept.md`
- Create: `content/english/middle/grammar/sentence-patterns/concept.md`
- Create: `content/english/high/grammar/relative-clauses/concept.md`

- [ ] **Step 1: 영어 개념 3개 작성**

`content/english/elementary/grammar/words-and-sentences/concept.md`:

```md
---
title: 단어와 문장
level: elementary
order: 1
next:
  - english/middle/grammar/sentence-patterns
---

## 핵심 아이디어

영어 문장은 **"누가(주어) + 한다(동사)"** 순서로 만든다. 우리말과 어순이 다르다는 것이 출발점이다.

- I run. (나는 달린다)
- She sings. (그녀는 노래한다)

## 단어의 종류 맛보기

- **이름을 나타내는 말(명사)**: dog, apple, school
- **움직임을 나타내는 말(동사)**: run, eat, sing

"주어 + 동사" 어순 감각이 중학교의 **문장의 형식** 공부로 이어진다.
```

`content/english/middle/grammar/sentence-patterns/concept.md`:

```md
---
title: 문장의 5형식
level: middle
order: 1
prev:
  - english/elementary/grammar/words-and-sentences
next:
  - english/high/grammar/relative-clauses
---

## 다섯 가지 뼈대

| 형식 | 구조 | 예문 |
|------|------|------|
| 1형식 | S + V | Birds fly. |
| 2형식 | S + V + C | She is happy. |
| 3형식 | S + V + O | I like music. |
| 4형식 | S + V + IO + DO | He gave me a book. |
| 5형식 | S + V + O + OC | We call him Tom. |

## 핵심

동사가 어떤 성분을 필요로 하는지에 따라 문장의 뼈대가 정해진다. 이 뼈대 위에 수식어가 붙어 긴 문장이 되며, 고등학교의 **관계대명사**는 그 수식을 절 단위로 확장하는 도구다.
```

`content/english/high/grammar/relative-clauses/concept.md`:

```md
---
title: 관계대명사
level: high
order: 1
prev:
  - english/middle/grammar/sentence-patterns
---

## 역할

두 문장을 하나로 이어 명사를 **절로 수식**한다.

- I met a girl. + She speaks Korean.
- → I met a girl **who** speaks Korean.

## 종류

| 선행사 | 주격 | 목적격 | 소유격 |
|--------|------|--------|--------|
| 사람 | who | who(m) | whose |
| 사물·동물 | which | which | whose |
| 공통 | that | that | — |

## 주의

- 목적격 관계대명사는 생략 가능: the book (that) I read
- 전치사 뒤에는 that을 쓸 수 없다: the house **in which** he lives

5형식에서 배운 문장 뼈대에 절 단위 수식이 더해져 복잡한 문장을 읽고 쓸 수 있게 된다.
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: 성공, **13 page(s) built**

- [ ] **Step 3: Commit**

```bash
git add content/english/
git commit -m "content: 영어 시드 개념 3건 (단어와 문장 → 문장의 5형식 → 관계대명사)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 수학 고등 — 함수의 극한 + 연결 갱신

**Files:**
- Create: `content/math/high/calculus/limits/concept.md`
- Modify: `content/math/middle/functions/quadratic-function/concept.md` (next 추가)

- [ ] **Step 1: 함수의 극한 작성** — `content/math/high/calculus/limits/concept.md`

```md
---
title: 함수의 극한
level: high
order: 1
prev:
  - math/middle/functions/quadratic-function
---

## 직관적 정의

$x$가 $a$에 한없이 가까워질 때 $f(x)$가 일정한 값 $L$에 가까워지면,

$$\lim_{x \to a} f(x) = L$$

이라 쓰고 "$x \to a$일 때 $f(x)$의 극한값은 $L$"이라고 한다.

## 예

$f(x) = x^2$에서 $x \to 2$이면 $f(x) \to 4$:

$$\lim_{x \to 2} x^2 = 4$$

## 왜 배우나

중학교에서 배운 일차·이차함수는 "값을 넣으면 값이 나오는" 대응이었다. 극한은 여기에 **"한없이 가까워진다"**는 관점을 더해, 순간변화율(미분)과 넓이(적분)로 가는 문을 연다.
```

- [ ] **Step 2: 이차함수 frontmatter에 next 추가** — `content/math/middle/functions/quadratic-function/concept.md`의 frontmatter를 아래로 교체 (본문은 그대로)

```yaml
---
title: 이차함수
level: middle
order: 2
prev:
  - math/middle/functions/linear-function
next:
  - math/high/calculus/limits
---
```

- [ ] **Step 3: 빌드 검증** (이차함수 ↔ 극한 양방향 링크 검증 포함)

Run: `npm run build`
Expected: 성공, **14 page(s) built**

Run: `grep -o "함수의 극한(고등)" dist/math/middle/functions/quadratic-function/index.html | head -1`
Expected: `함수의 극한(고등)` (연결 경로에 표시)

- [ ] **Step 4: Commit**

```bash
git add content/math/
git commit -m "content: 수학 고등 함수의 극한 추가 및 이차함수 연결 갱신

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: giscus 댓글 컴포넌트

**Files:**
- Create: `src/components/Comments.astro`
- Modify: `src/pages/[...path].astro` (Comments 포함)
- Modify: `src/styles/global.css` (댓글 여백)
- Modify: `e2e/smoke.spec.ts` (테스트 2건 추가)

- [ ] **Step 1: Discussions 활성화 + giscus ID 조회**

Run: `gh api -X PATCH repos/minomidev-lab/concept-notes -F has_discussions=true -q .has_discussions`
Expected: `true`

Run: `gh api graphql -f query='{repository(owner:"minomidev-lab",name:"concept-notes"){id discussionCategories(first:10){nodes{id name}}}}'`
Expected: JSON — `repository.id`(= `<REPO_ID>`)와 categories 중 `name: "Announcements"`의 `id`(= `<CATEGORY_ID>`)를 기록. Announcements가 없으면 `General`의 id를 쓰고 data-category도 General로 맞춘다.

- [ ] **Step 2: Comments.astro 작성** — `<REPO_ID>`/`<CATEGORY_ID>`를 Step 1의 실제 값으로 치환

```astro
---
---
<section class="comments">
  <h2>💬 댓글</h2>
  <p class="comments-hint">GitHub 계정으로 댓글을 남길 수 있어요.</p>
  <div class="giscus"></div>
</section>
<script
  is:inline
  src="https://giscus.app/client.js"
  data-repo="minomidev-lab/concept-notes"
  data-repo-id="<REPO_ID>"
  data-category="Announcements"
  data-category-id="<CATEGORY_ID>"
  data-mapping="pathname"
  data-strict="0"
  data-reactions-enabled="1"
  data-emit-metadata="0"
  data-input-position="bottom"
  data-theme="light"
  data-lang="ko"
  crossorigin="anonymous"
  async></script>
```

- [ ] **Step 3: [...path].astro에 포함** — import 블록에 추가:

```astro
import Comments from '../components/Comments.astro';
```

`</section>`(my-note 섹션 닫힘)과 `<EditUI ...>` 사이에 한 줄 추가:

```astro
  <Comments />
```

- [ ] **Step 4: global.css 끝에 추가**

```css

/* ---- 댓글 (3단계) ---- */
.comments { margin-top: 32px; border-top: 1px solid #d0d7de; padding-top: 16px; }
.comments-hint { color: #57606a; font-size: 14px; }
```

- [ ] **Step 5: e2e 테스트 2건 추가** — `e2e/smoke.spec.ts` 끝에 추가 (giscus 외부 요청은 차단해 결정적으로 만든다)

```ts
test('4과목이 모두 홈에 보인다', async ({ page }) => {
  await page.goto('./');
  for (const subject of ['수학', '과학', '국어', '영어']) {
    await expect(page.getByRole('heading', { level: 2, name: subject })).toBeVisible();
  }
});

test('개념 페이지에 댓글 섹션이 있다', async ({ page }) => {
  await page.route('https://giscus.app/**', (route) => route.abort());
  await page.goto('science/middle/forces/force-and-motion/');
  await expect(page.getByRole('heading', { name: '💬 댓글' })).toBeVisible();
  await expect(page.locator('.giscus')).toBeAttached();
});
```

- [ ] **Step 6: 검증**

Run: `npm run build && npx playwright test`
Expected: 빌드 14쪽, **10 passed** (기존 8 + 신규 2)

Run: `npx vitest run`
Expected: 22건 통과 (회귀)

- [ ] **Step 7: Commit**

```bash
git add src/components/Comments.astro "src/pages/[...path].astro" src/styles/global.css e2e/smoke.spec.ts
git commit -m "feat: giscus 댓글 섹션 (GitHub Discussions 기반)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 배포 + giscus 앱 설치 안내

- [ ] **Step 1: main 병합·push**

```bash
git checkout main
git merge --ff-only feature/stage3-comments-content
git push origin main
```

- [ ] **Step 2: 배포 확인**

Run: `gh run watch $(gh run list --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId') --exit-status`
Expected: 성공

Run: `curl -s -o /dev/null -w "%{http_code}" https://minomidev-lab.github.io/concept-notes/science/middle/forces/force-and-motion/`
Expected: `200`

- [ ] **Step 3: 사용자 안내 출력** — 댓글 작동에 필요한 마지막 1클릭:

> https://github.com/apps/giscus 에서 **Install** → "Only select repositories" → `concept-notes` 선택.
> 설치 즉시 모든 개념 페이지에서 GitHub 계정으로 댓글을 달 수 있습니다. (설치 전에는 댓글 위젯이 오류 안내를 표시하지만 사이트의 다른 기능은 정상)

---

## 완료 기준 (3단계 성공 검증)

- [ ] 빌드 14쪽 (개념 13 + 홈), 링크·라벨 검증 통과
- [ ] `npx vitest run` 22건, `npx playwright test` 10건 통과
- [ ] 4과목 모두 사이드바·홈에 표시, 각 과목에 초→중→고 연결 사슬 존재
- [ ] 배포 후 새 개념 페이지 200 응답
- [ ] 댓글 섹션 노출 (완전한 작동은 giscus 앱 설치라는 사용자 1클릭 후)

## 다음 단계 메모

- 4단계(책 PDF 내보내기)는 별도 프로젝트로 진행
- 콘텐츠는 이후 사용자가 공부하는 단원 순서대로 Claude에게 요청해 계속 확장 ("과학 중등 전기 단원 추가해줘" 식)
