# 나만의 개념노트 — 2단계(나의 편집) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 배포된 사이트에서 소유자가 GitHub fine-grained PAT로 인증한 뒤, 태블릿·PC 브라우저에서 "나의 이해"와 개념 설명을 마크다운 에디터로 수정하고 손 스케치를 그려 저장(=GitHub 커밋)할 수 있게 한다.

**Architecture:** 서버 없음 — 브라우저에서 GitHub Contents REST API를 직접 호출해 저장소 파일을 읽고(커밋 sha 포함) 쓴다(커밋 생성). 클라이언트 코드는 Astro `<script>`로 번들되는 바닐라 TS 모듈 6개로 구성하며, editor↔sketch 간 결합은 DOM id + CustomEvent로 끊는다. 저장 성공 시 페이지에 즉시 반영(재배포 1~2분은 백그라운드), 실패 시 초안을 localStorage에 보존한다.

**Tech Stack:** 기존 스택(Astro 6 고정) + `marked`(클라이언트 마크다운 미리보기, ^15 고정) + KaTeX auto-render(기설치 katex에 포함). 테스트: Vitest(순수 유틸 + fetch 모킹), Playwright(GitHub API `page.route` 모킹 — 실토큰 불필요).

**스펙:** `docs/superpowers/specs/2026-08-07-concept-notes-design.md` §6 편집 흐름, §8 에러 처리 (2단계 범위)

**스펙 대비 조정 1건 (Task 7에서 스펙 문서에 반영):** 스케치 저장 위치를 `content/<개념>/sketches/` → **`public/sketches/<개념경로>/`**로 변경. 이유: Astro의 마크다운 상대 경로 이미지 최적화는 `src/` 내부 이미지를 전제로 하며(공식 문서), `content/`는 프로젝트 루트에 있어 처리가 보장되지 않는다. `public/`은 빌드 가공 없이 그대로 배포되므로 브라우저에서 커밋한 PNG가 확실히 서빙되고, 노트에는 base 포함 절대 경로(`/concept-notes/sketches/...`)로 삽입한다. 스트로크 원본(JSON)도 같은 폴더에 저장해 재편집을 지원한다.

**실행 환경 메모:**

- Windows, Bash 툴(git bash). 프로젝트 루트 `C:\minomi\code\study`. 저장소 `minomidev-lab/concept-notes`(공개), 배포는 main push 시 자동.
- 1단계 완료 상태: Vitest 7건, Playwright 3건(e2e/smoke.spec.ts), 빌드 4쪽. 이 숫자들이 회귀 기준선이다.
- 구현은 새 브랜치 `feature/stage2-editing`에서 진행하고, 마지막 태스크에서 main에 합쳐 배포한다.
- e2e는 GitHub API를 전부 모킹하므로 실제 토큰 없이 통과해야 한다.

**파일 구조 (이 계획이 만드는/바꾸는 것):**

```
src/lib/client/
  config.ts      # 저장소 상수·파일 경로/URL 헬퍼
  auth.ts        # PAT localStorage 보관
  textfile.ts    # base64(UTF-8)·frontmatter 분리/결합 (순수 함수)
  github.ts      # Contents API: getFile/getSha/putFile + Auth/Conflict 오류
  preview.ts     # marked + KaTeX 미리보기, 세션 스케치 이미지 보정
  editor.ts      # 편집 모드 진입·에디터 오버레이·저장·초안·충돌
  sketch.ts      # 스케치 캔버스·저장·재편집 (editor와 DOM/이벤트로만 결합)
src/types/katex-auto-render.d.ts
src/components/EditUI.astro          # 편집 진입 버튼 + 에디터/스케치 오버레이 마크업
src/pages/[...path].astro            # 수정: 본문 래퍼·연필 버튼·EditUI 포함
src/styles/global.css                # 수정: 편집 UI 스타일 추가
tests/textfile.test.ts               # 새 단위 테스트
tests/github.test.ts                 # 새 단위 테스트 (fetch 모킹)
e2e/edit.spec.ts                     # 편집 흐름 e2e (API 모킹)
e2e/sketch.spec.ts                   # 스케치 흐름 e2e (API 모킹)
docs/superpowers/specs/...design.md  # 수정: 스케치 저장 위치 조정 반영
```

---

### Task 0: 작업 브랜치 생성

- [ ] **Step 1:**

```bash
git checkout -b feature/stage2-editing
```

Run: `git branch --show-current`
Expected: `feature/stage2-editing`

---

### Task 1: 순수 유틸 — textfile.ts, auth.ts, config.ts (TDD)

**Files:**
- Create: `src/lib/client/textfile.ts`
- Create: `src/lib/client/auth.ts`
- Create: `src/lib/client/config.ts`
- Test: `tests/textfile.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/textfile.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import {
  encodeBase64, decodeBase64, splitFrontmatter, joinFrontmatter, noteFrontmatter,
} from '../src/lib/client/textfile';

describe('base64 (UTF-8 안전)', () => {
  it('한국어·수식 텍스트를 왕복 변환한다', () => {
    const text = '기울기 $a$는 **변화 속도**다.\n$y = ax + b$';
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it('개행이 섞인 base64도 디코딩한다 (GitHub API 응답 형태)', () => {
    const b64 = encodeBase64('안녕하세요');
    const wrapped = b64.slice(0, 4) + '\n' + b64.slice(4);
    expect(decodeBase64(wrapped)).toBe('안녕하세요');
  });
});

describe('frontmatter 분리/결합', () => {
  it('frontmatter와 본문을 분리한다', () => {
    const doc = '---\nupdated: 2026-08-08\n---\n\n본문입니다.\n';
    expect(splitFrontmatter(doc)).toEqual({
      frontmatter: '---\nupdated: 2026-08-08\n---\n',
      body: '본문입니다.\n',
    });
  });

  it('CRLF 문서도 분리한다', () => {
    const doc = '---\r\nupdated: 2026-08-08\r\n---\r\n\r\n본문';
    expect(splitFrontmatter(doc).body).toBe('본문');
  });

  it('frontmatter가 없으면 전체가 본문이다', () => {
    expect(splitFrontmatter('그냥 본문')).toEqual({ frontmatter: '', body: '그냥 본문' });
  });

  it('joinFrontmatter는 빈 줄 하나로 이어 붙이고 개행으로 끝낸다', () => {
    expect(joinFrontmatter('---\ntitle: x\n---\n', '본문')).toBe('---\ntitle: x\n---\n\n본문\n');
  });

  it('frontmatter가 비면 본문만 반환한다', () => {
    expect(joinFrontmatter('', '본문')).toBe('본문');
  });

  it('noteFrontmatter는 updated 날짜를 넣는다', () => {
    expect(noteFrontmatter('2026-08-08')).toBe('---\nupdated: 2026-08-08\n---\n');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/textfile.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/client/textfile'`

- [ ] **Step 3: 구현** — `src/lib/client/textfile.ts`

```ts
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function decodeBase64(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export interface SplitDoc { frontmatter: string; body: string }

export function splitFrontmatter(text: string): SplitDoc {
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!match) return { frontmatter: '', body: text };
  return { frontmatter: match[0], body: text.slice(match[0].length).replace(/^\r?\n/, '') };
}

export function joinFrontmatter(frontmatter: string, body: string): string {
  if (!frontmatter) return body;
  return `${frontmatter}\n${body}\n`;
}

/** my-note.md 저장 시 updated를 오늘 날짜로 새로 쓴다 */
export function noteFrontmatter(dateIso: string): string {
  return `---\nupdated: ${dateIso}\n---\n`;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run`
Expected: PASS — 기존 7건 + 신규 7건 = 14건

- [ ] **Step 5: auth.ts 작성** — `src/lib/client/auth.ts` (localStorage 래퍼 — 단위 테스트 생략, e2e에서 검증)

```ts
const TOKEN_KEY = 'concept-notes:token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

/** 인증 실패 시 지워서, 다음 ✏️ 편집 클릭에서 재입력 프롬프트가 뜨게 한다 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
```

- [ ] **Step 6: config.ts 작성** — `src/lib/client/config.ts`

```ts
export const REPO = { owner: 'minomidev-lab', repo: 'concept-notes', branch: 'main' } as const;

export function myNotePath(conceptPath: string): string {
  return `content/${conceptPath}/my-note.md`;
}

export function conceptFilePath(conceptPath: string): string {
  return `content/${conceptPath}/concept.md`;
}

/** 저장소 안의 스케치 파일 경로 (커밋 대상) */
export function sketchFilePath(conceptPath: string, fileName: string): string {
  return `public/sketches/${conceptPath}/${fileName}`;
}

/** 사이트에서 스케치가 서빙되는 절대 URL (마크다운에 삽입) */
export function sketchUrl(conceptPath: string, fileName: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/sketches/${conceptPath}/${fileName}`;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/client/textfile.ts src/lib/client/auth.ts src/lib/client/config.ts tests/textfile.test.ts
git commit -m "feat: 편집 클라이언트 기반 유틸 (base64·frontmatter·토큰·경로)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: GitHub Contents API 클라이언트 (TDD)

**Files:**
- Create: `src/lib/client/github.ts`
- Test: `tests/github.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/github.test.ts`

`fetch`를 스텁해서 요청 형태와 오류 매핑을 검증한다.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFile, getSha, putFile, AuthError, ConflictError } from '../src/lib/client/github';
import { encodeBase64 } from '../src/lib/client/textfile';

function mockFetchOnce(status: number, json: unknown): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => vi.unstubAllGlobals());

describe('getFile', () => {
  it('본문을 디코딩하고 sha를 돌려준다', async () => {
    const fn = mockFetchOnce(200, { content: encodeBase64('본문 텍스트'), sha: 'abc' });
    const file = await getFile('tok', 'content/x/my-note.md');
    expect(file).toEqual({ text: '본문 텍스트', sha: 'abc' });
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe(
      'https://api.github.com/repos/minomidev-lab/concept-notes/contents/content/x/my-note.md?ref=main',
    );
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('404면 null (신규 파일)', async () => {
    mockFetchOnce(404, { message: 'Not Found' });
    expect(await getFile('tok', 'content/x/my-note.md')).toBeNull();
  });

  it('401이면 AuthError', async () => {
    mockFetchOnce(401, { message: 'Bad credentials' });
    await expect(getFile('tok', 'p')).rejects.toBeInstanceOf(AuthError);
  });
});

describe('getSha', () => {
  it('sha만 돌려주고 없으면 null', async () => {
    mockFetchOnce(200, { sha: 'xyz', content: 'ignored' });
    expect(await getSha('tok', 'public/sketches/a/b.png')).toBe('xyz');
    mockFetchOnce(404, {});
    expect(await getSha('tok', 'none')).toBeNull();
  });
});

describe('putFile', () => {
  it('텍스트를 base64로 커밋하고 새 sha를 돌려준다', async () => {
    const fn = mockFetchOnce(201, { content: { sha: 'new-sha' } });
    const result = await putFile('tok', 'content/x/my-note.md', {
      message: 'note: 수정', text: '새 본문', sha: 'old-sha',
    });
    expect(result).toEqual({ sha: 'new-sha' });
    const body = JSON.parse(fn.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ message: 'note: 수정', branch: 'main', sha: 'old-sha' });
    expect(body.content).toBe(encodeBase64('새 본문'));
  });

  it('sha 없이 호출하면 body에 sha를 넣지 않는다 (신규 생성)', async () => {
    const fn = mockFetchOnce(201, { content: { sha: 's' } });
    await putFile('tok', 'p', { message: 'm', text: 't' });
    expect('sha' in JSON.parse(fn.mock.calls[0][1].body as string)).toBe(false);
  });

  it('409/422는 ConflictError', async () => {
    mockFetchOnce(409, { message: 'conflict' });
    await expect(putFile('tok', 'p', { message: 'm', text: 't' })).rejects.toBeInstanceOf(ConflictError);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/github.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/client/github'`

- [ ] **Step 3: 구현** — `src/lib/client/github.ts`

```ts
import { encodeBase64, decodeBase64 } from './textfile';
import { REPO } from './config';

export class AuthError extends Error {}
export class ConflictError extends Error {}

export interface RepoFile { text: string; sha: string }

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function contentsUrl(path: string): string {
  return `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${path}`;
}

function throwByStatus(status: number, action: string): never {
  if (status === 401 || status === 403) throw new AuthError(`GitHub 인증 실패 (${status})`);
  if (status === 409 || status === 422) throw new ConflictError('원격에 더 새로운 버전이 있습니다.');
  throw new Error(`GitHub ${action} 실패 (${status})`);
}

export async function getFile(token: string, path: string): Promise<RepoFile | null> {
  const res = await fetch(`${contentsUrl(path)}?ref=${REPO.branch}`, { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) throwByStatus(res.status, '조회');
  const json = await res.json();
  return { text: decodeBase64(json.content), sha: json.sha };
}

/** 바이너리 파일 등 sha만 필요할 때 (없으면 null) */
export async function getSha(token: string, path: string): Promise<string | null> {
  const res = await fetch(`${contentsUrl(path)}?ref=${REPO.branch}`, { headers: headers(token) });
  if (!res.ok) return null;
  const json = await res.json();
  return json.sha ?? null;
}

export interface PutOptions {
  message: string;
  /** 텍스트 파일이면 text, 바이너리면 base64 중 하나 */
  text?: string;
  base64?: string;
  /** 기존 파일 갱신 시 필수. 생략하면 신규 생성 */
  sha?: string;
}

export async function putFile(
  token: string,
  path: string,
  opts: PutOptions,
): Promise<{ sha: string }> {
  const content = opts.base64 ?? encodeBase64(opts.text ?? '');
  const res = await fetch(contentsUrl(path), {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message: opts.message,
      content,
      branch: REPO.branch,
      ...(opts.sha ? { sha: opts.sha } : {}),
    }),
  });
  if (!res.ok) throwByStatus(res.status, '저장');
  const json = await res.json();
  return { sha: json.content.sha };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run`
Expected: PASS — 14건 + 신규 7건 = 21건

- [ ] **Step 5: Commit**

```bash
git add src/lib/client/github.ts tests/github.test.ts
git commit -m "feat: GitHub Contents API 클라이언트 (조회·커밋·충돌 감지)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 마크다운 미리보기 — marked + KaTeX

**Files:**
- Modify: `package.json` (marked 추가 — npm install로)
- Create: `src/lib/client/preview.ts`
- Create: `src/types/katex-auto-render.d.ts`

- [ ] **Step 1: marked 설치**

Run: `npm install marked@^15.0.0`
Expected: 성공, package.json dependencies에 marked 추가

- [ ] **Step 2: 타입 선언** — `src/types/katex-auto-render.d.ts`

```ts
declare module 'katex/dist/contrib/auto-render.mjs' {
  interface AutoRenderOptions {
    delimiters?: { left: string; right: string; display: boolean }[];
    throwOnError?: boolean;
  }
  export default function renderMathInElement(
    el: HTMLElement,
    options?: AutoRenderOptions,
  ): void;
}
```

- [ ] **Step 3: preview.ts 작성** — `src/lib/client/preview.ts`

```ts
import { marked } from 'marked';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

/** 이 세션에서 새로 저장한 스케치: 사이트에 아직 배포 전이므로 dataURL로 표시 */
const sessionImages = new Map<string, string>();

export function registerSessionImage(url: string, dataUrl: string): void {
  sessionImages.set(url, dataUrl);
}

export function renderPreview(md: string, container: HTMLElement): void {
  container.innerHTML = marked.parse(md, { async: false }) as string;
  for (const img of container.querySelectorAll('img')) {
    const fresh = sessionImages.get(img.getAttribute('src') ?? '');
    if (fresh) img.src = fresh;
  }
  renderMathInElement(container, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
  });
}
```

- [ ] **Step 4: 빌드 회귀 확인** (preview.ts는 아직 미사용 — 컴파일만)

Run: `npm run build`
Expected: 성공, 4쪽

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/client/preview.ts src/types/katex-auto-render.d.ts
git commit -m "feat: marked + KaTeX 클라이언트 마크다운 미리보기

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 편집 UI 마크업 + 스타일

**Files:**
- Create: `src/components/EditUI.astro`
- Modify: `src/pages/[...path].astro` (본문 래퍼·연필 버튼·EditUI 포함)
- Modify: `src/styles/global.css` (편집 스타일 블록 추가)

- [ ] **Step 1: EditUI.astro 작성** — `src/components/EditUI.astro`

`initEditUI`/`initSketch`는 Task 5·6에서 만들지만, 이 태스크에서는 **스크립트 없이 마크업·스타일만** 커밋한다 (script 블록은 Task 5에서 추가).

```astro
---
interface Props { conceptPath: string }
const { conceptPath } = Astro.props;
---
<div id="edit-root" data-concept-path={conceptPath}>
  <button id="edit-enter" type="button" aria-label="편집 모드">✏️ 편집</button>

  <div id="editor-overlay" class="overlay" hidden>
    <div class="overlay-panel">
      <div class="overlay-toolbar">
        <strong id="editor-title">노트 편집</strong>
        <span id="editor-status" role="status"></span>
        <button id="editor-sketch" type="button">🎨 스케치</button>
        <button id="editor-save" type="button">저장</button>
        <button id="editor-close" type="button">닫기</button>
      </div>
      <div class="editor-split">
        <textarea
          id="editor-input"
          spellcheck="false"
          placeholder="마크다운으로 작성하세요. 수식은 $y = ax + b$ 형태로 씁니다."></textarea>
        <div id="editor-preview" class="editor-preview"></div>
      </div>
    </div>
  </div>

  <div id="sketch-overlay" class="overlay" hidden>
    <div class="overlay-panel">
      <div class="overlay-toolbar">
        <strong>🎨 스케치</strong>
        <label>색
          <select id="sketch-color">
            <option value="#1f2328">검정</option>
            <option value="#c9303e">빨강</option>
            <option value="#0969da">파랑</option>
            <option value="#1a7f37">초록</option>
          </select>
        </label>
        <label>굵기 <input id="sketch-width" type="range" min="2" max="16" value="4" /></label>
        <button id="sketch-eraser" type="button" aria-pressed="false">지우개</button>
        <button id="sketch-undo" type="button">되돌리기</button>
        <button id="sketch-save" type="button">저장</button>
        <button id="sketch-close" type="button">닫기</button>
      </div>
      <canvas id="sketch-canvas" width="1200" height="800"></canvas>
    </div>
  </div>
</div>
```

- [ ] **Step 2: [...path].astro 수정** — 아래 두 군데를 교체하고 import 추가

frontmatter의 import 블록에 추가:

```astro
import EditUI from '../components/EditUI.astro';
```

본문 마크업을 아래로 교체 (`<BaseLayout ...>` 내부 전체):

```astro
<BaseLayout title={concept.data.title} currentPath={concept.id}>
  <ConceptPath title={concept.data.title} prev={prev} next={next} />
  <article class="concept">
    <h1>{concept.data.title}</h1>
    <button class="edit-btn" id="edit-concept" type="button">✏️ 개념 설명 편집</button>
    <div class="concept-body">
      <Content />
    </div>
  </article>
  <section class="my-note">
    <h2>✏️ 나의 이해</h2>
    <button class="edit-btn" id="edit-note" type="button">✏️ 나의 이해 편집</button>
    <div class="note-body">
      {NoteContent ? <NoteContent /> : <p class="empty">아직 작성한 노트가 없습니다.</p>}
    </div>
  </section>
  <EditUI conceptPath={concept.id} />
</BaseLayout>
```

- [ ] **Step 3: global.css에 편집 스타일 추가** — 파일 끝에 아래 블록 추가

```css
/* ---- 편집 모드 (2단계) ---- */
#edit-enter {
  position: fixed;
  top: 8px;
  right: 12px;
  z-index: 30;
  font-size: 14px;
  background: #fff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
}

.edit-btn {
  display: none;
  margin: 4px 0 12px;
  font-size: 13px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
}
body.editing .edit-btn { display: inline-block; }

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}
.overlay[hidden] { display: none; }

.overlay-panel {
  background: #fff;
  border-radius: 10px;
  width: min(1100px, 100%);
  height: min(760px, 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.overlay-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #d0d7de;
  flex-wrap: wrap;
}
.overlay-toolbar strong { margin-right: auto; }
#editor-status { font-size: 13px; color: #57606a; }

.editor-split { flex: 1; display: flex; min-height: 0; }
#editor-input {
  flex: 1;
  border: none;
  resize: none;
  padding: 14px;
  font: 14px/1.7 ui-monospace, Consolas, monospace;
  outline: none;
  border-right: 1px solid #d0d7de;
}
.editor-preview { flex: 1; padding: 14px; overflow-y: auto; }
.editor-preview img { max-width: 100%; }

#sketch-canvas {
  flex: 1;
  width: 100%;
  height: 100%;
  touch-action: none;
  background: #fff;
}

@media (max-width: 899px) {
  .editor-split { flex-direction: column; }
  #editor-input { border-right: none; border-bottom: 1px solid #d0d7de; min-height: 40%; }
}
```

- [ ] **Step 4: 빌드·마크업 확인**

Run: `npm run build && grep -c "edit-enter" dist/math/middle/functions/linear-function/index.html`
Expected: 1 이상

Run: `grep -c "edit-enter" dist/index.html`
Expected: 0 (홈에는 편집 UI 없음 — `grep -c`는 0을 출력하고 종료코드 1이므로 `|| true`를 붙여 실행)

Run: `npx playwright test`
Expected: 기존 3건 통과 (마크업 추가가 스모크를 깨지 않음)

- [ ] **Step 5: Commit**

```bash
git add src/components/EditUI.astro "src/pages/[...path].astro" src/styles/global.css
git commit -m "feat: 편집 UI 마크업과 오버레이 스타일

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 에디터 로직 — editor.ts + e2e

**Files:**
- Create: `src/lib/client/editor.ts`
- Modify: `src/components/EditUI.astro` (script 블록 추가)
- Test: `e2e/edit.spec.ts`

- [ ] **Step 1: editor.ts 작성** — `src/lib/client/editor.ts`

```ts
import { getFile, putFile, AuthError, ConflictError } from './github';
import { getToken, setToken, clearToken } from './auth';
import { myNotePath, conceptFilePath } from './config';
import { splitFrontmatter, joinFrontmatter, noteFrontmatter } from './textfile';
import { renderPreview } from './preview';

type Target = 'note' | 'concept';

interface EditState {
  conceptPath: string;
  target: Target;
  /** concept.md는 로드 시점 frontmatter를 그대로 보존해 되쓴다 */
  frontmatter: string;
  /** null이면 신규 파일 (생성 커밋) */
  sha: string | null;
}

let state: EditState | null = null;

function draftKey(conceptPath: string, target: Target): string {
  return `concept-notes:draft:${target}:${conceptPath}`;
}

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function initEditUI(): void {
  const root = document.getElementById('edit-root');
  if (!root) return;
  const conceptPath = root.dataset.conceptPath!;

  el('edit-enter').addEventListener('click', () => {
    if (!getToken()) {
      const token = window.prompt(
        'GitHub fine-grained 토큰을 입력하세요.\n(concept-notes 저장소 Contents 쓰기 권한 · 이 기기 브라우저에만 저장됩니다)',
      );
      if (!token) return;
      setToken(token);
    }
    document.body.classList.toggle('editing');
  });

  el('edit-note').addEventListener('click', () => void openEditor(conceptPath, 'note'));
  el('edit-concept').addEventListener('click', () => void openEditor(conceptPath, 'concept'));

  const input = el<HTMLTextAreaElement>('editor-input');
  const preview = el('editor-preview');

  input.addEventListener('input', () => {
    renderPreview(input.value, preview);
    if (state) localStorage.setItem(draftKey(state.conceptPath, state.target), input.value);
  });

  // 미리보기의 스케치 이미지를 탭하면 이어 그리기 (sketch.ts가 수신)
  preview.addEventListener('click', (e) => {
    const img = (e.target as HTMLElement).closest('img');
    const src = img?.getAttribute('src');
    if (src && src.includes('/sketches/')) {
      document.dispatchEvent(new CustomEvent('sketch:open', { detail: src }));
    }
  });

  el('editor-save').addEventListener('click', () => void save());
  el('editor-close').addEventListener('click', () => {
    el('editor-overlay').hidden = true;
    state = null;
  });
}

async function openEditor(conceptPath: string, target: Target): Promise<void> {
  const token = getToken();
  if (!token) return;
  const input = el<HTMLTextAreaElement>('editor-input');
  const preview = el('editor-preview');
  const status = el('editor-status');

  el('editor-title').textContent = target === 'note' ? '✏️ 나의 이해 편집' : '📘 개념 설명 편집';
  status.textContent = '불러오는 중…';
  el('editor-overlay').hidden = false;

  const path = target === 'note' ? myNotePath(conceptPath) : conceptFilePath(conceptPath);
  try {
    const file = await getFile(token, path);
    const { frontmatter, body } = file
      ? splitFrontmatter(file.text)
      : { frontmatter: '', body: '' };
    state = { conceptPath, target, frontmatter, sha: file?.sha ?? null };

    const draft = localStorage.getItem(draftKey(conceptPath, target));
    if (draft !== null && draft !== body && window.confirm('저장되지 않은 초안이 있습니다. 불러올까요?')) {
      input.value = draft;
    } else {
      input.value = body;
    }
    renderPreview(input.value, preview);
    status.textContent = '';
  } catch (err) {
    if (err instanceof AuthError) {
      clearToken();
      status.textContent = '인증 실패 — ✏️ 편집을 다시 눌러 토큰을 재입력하세요.';
    } else {
      status.textContent = '불러오기 실패 — 네트워크를 확인하세요.';
    }
  }
}

async function save(): Promise<void> {
  if (!state) return;
  const token = getToken();
  if (!token) return;
  const input = el<HTMLTextAreaElement>('editor-input');
  const status = el('editor-status');

  const path = state.target === 'note' ? myNotePath(state.conceptPath) : conceptFilePath(state.conceptPath);
  const frontmatter =
    state.target === 'note'
      ? noteFrontmatter(new Date().toISOString().slice(0, 10))
      : state.frontmatter;
  const text = joinFrontmatter(frontmatter, input.value);
  const message =
    state.target === 'note'
      ? `note: ${state.conceptPath} 나의 이해 수정`
      : `docs: ${state.conceptPath} 개념 설명 수정`;

  status.textContent = '저장 중…';
  try {
    const result = await putFile(token, path, { message, text, sha: state.sha ?? undefined });
    state.sha = result.sha;
    localStorage.removeItem(draftKey(state.conceptPath, state.target));
    applyToPage(state.target, input.value);
    status.textContent = '저장됨 ✓ (사이트 반영까지 1~2분)';
  } catch (err) {
    if (err instanceof ConflictError) {
      if (window.confirm('원격에 더 새로운 버전이 있습니다. 덮어쓸까요?')) {
        const fresh = await getFile(token, path);
        state.sha = fresh?.sha ?? null;
        await save();
      } else {
        status.textContent = '저장 취소됨 — 초안은 이 기기에 남아 있습니다.';
      }
    } else if (err instanceof AuthError) {
      clearToken();
      status.textContent = '인증 실패 — ✏️ 편집을 다시 눌러 토큰을 재입력하세요. 초안은 이 기기에 남아 있습니다.';
    } else {
      status.textContent = '저장 실패 — 다시 시도하세요. 초안은 이 기기에 남아 있습니다.';
    }
  }
}

/** 저장 성공 시 페이지 본문에 즉시 반영 (재배포를 기다리지 않음) */
function applyToPage(target: Target, body: string): void {
  const selector = target === 'note' ? '.my-note .note-body' : 'article.concept .concept-body';
  const elBody = document.querySelector(selector);
  if (elBody) renderPreview(body, elBody as HTMLElement);
}
```

- [ ] **Step 2: EditUI.astro에 script 블록 추가** — 파일 끝(닫는 `</div>` 다음)에 추가

```astro
<script>
  import { initEditUI } from '../lib/client/editor';
  initEditUI();
</script>
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공 (클라이언트 스크립트 번들 생성)

- [ ] **Step 4: e2e 작성** — `e2e/edit.spec.ts`

```ts
import { test, expect } from '@playwright/test';

const NOTE_MD = '---\nupdated: 2026-08-08\n---\n\n기존 노트 내용입니다.\n';

function b64(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64');
}

test('토큰 프롬프트를 취소하면 편집 모드로 들어가지 않는다', async ({ page }) => {
  await page.goto('math/middle/functions/linear-function/');
  // Playwright는 기본적으로 dialog를 dismiss한다 (프롬프트 취소와 동일)
  await page.locator('#edit-enter').click();
  await expect(page.locator('#edit-note')).toBeHidden();
});

test('편집 모드에서 노트를 수정·저장하면 커밋 요청과 즉시 반영이 일어난다', async ({ page }) => {
  let putBody: { sha?: string; content?: string } = {};
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && req.url().includes('my-note.md')) {
      await route.fulfill({ json: { content: b64(NOTE_MD), sha: 'sha-old' } });
    } else if (req.method() === 'PUT' && req.url().includes('my-note.md')) {
      putBody = req.postDataJSON();
      await route.fulfill({ json: { content: { sha: 'sha-new' } } });
    } else {
      await route.fulfill({ status: 404, json: { message: 'not found' } });
    }
  });
  await page.addInitScript(() => localStorage.setItem('concept-notes:token', 'test-token'));

  await page.goto('math/middle/functions/linear-function/');
  await page.locator('#edit-enter').click();
  await page.locator('#edit-note').click();

  const input = page.locator('#editor-input');
  await expect(input).toHaveValue(/기존 노트 내용/);
  await input.fill('수정된 노트: 기울기는 변화율이다.');
  await expect(page.locator('#editor-preview')).toContainText('수정된 노트');
  await page.locator('#editor-save').click();
  await expect(page.locator('#editor-status')).toContainText('저장됨');

  expect(putBody.sha).toBe('sha-old');
  const saved = Buffer.from(putBody.content!, 'base64').toString('utf-8');
  expect(saved).toContain('수정된 노트: 기울기는 변화율이다.');
  expect(saved).toMatch(/^---\nupdated: \d{4}-\d{2}-\d{2}\n---\n/);

  await page.locator('#editor-close').click();
  await expect(page.locator('.my-note .note-body')).toContainText('수정된 노트');
});

test('저장 충돌 시 확인을 거쳐 덮어쓴다', async ({ page }) => {
  let putCount = 0;
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && req.url().includes('my-note.md')) {
      await route.fulfill({ json: { content: b64(NOTE_MD), sha: putCount === 0 ? 'sha-old' : 'sha-newer' } });
    } else if (req.method() === 'PUT') {
      putCount += 1;
      if (putCount === 1) {
        await route.fulfill({ status: 409, json: { message: 'conflict' } });
      } else {
        await route.fulfill({ json: { content: { sha: 'sha-final' } } });
      }
    } else {
      await route.fulfill({ status: 404, json: {} });
    }
  });
  await page.addInitScript(() => localStorage.setItem('concept-notes:token', 'test-token'));
  page.on('dialog', (d) => void d.accept());

  await page.goto('math/middle/functions/linear-function/');
  await page.locator('#edit-enter').click();
  await page.locator('#edit-note').click();
  await page.locator('#editor-input').fill('충돌 테스트 본문');
  await page.locator('#editor-save').click();

  await expect(page.locator('#editor-status')).toContainText('저장됨');
  expect(putCount).toBe(2);
});
```

- [ ] **Step 5: 테스트 실행**

Run: `npm run build && npx playwright test e2e/edit.spec.ts`
Expected: 3 passed

Run: `npx playwright test`
Expected: 6 passed (기존 스모크 3 + 신규 3)

- [ ] **Step 6: Commit**

```bash
git add src/lib/client/editor.ts src/components/EditUI.astro e2e/edit.spec.ts
git commit -m "feat: 마크다운 에디터 — 토큰 인증·저장·초안·충돌 처리

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 스케치 캔버스 — sketch.ts + e2e

**Files:**
- Create: `src/lib/client/sketch.ts`
- Modify: `src/components/EditUI.astro` (script에 initSketch 추가)
- Test: `e2e/sketch.spec.ts`

- [ ] **Step 1: sketch.ts 작성** — `src/lib/client/sketch.ts`

editor.ts를 import하지 않는다 — DOM id와 `sketch:open` CustomEvent로만 결합.

```ts
import { putFile, getSha } from './github';
import { getToken } from './auth';
import { sketchFilePath, sketchUrl } from './config';
import { registerSessionImage } from './preview';

interface Stroke {
  color: string;
  width: number;
  points: [number, number][];
}

let strokes: Stroke[] = [];
let current: Stroke | null = null;
/** 기존 스케치 이어 그리기 시 파일명(확장자 제외). null이면 새 스케치 */
let editingName: string | null = null;
const sessionStrokes = new Map<string, Stroke[]>();

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function initSketch(): void {
  const root = document.getElementById('edit-root');
  if (!root) return;
  const conceptPath = root.dataset.conceptPath!;
  const canvas = el<HTMLCanvasElement>('sketch-canvas');
  const ctx = canvas.getContext('2d')!;

  const pos = (e: PointerEvent): [number, number] => {
    const rect = canvas.getBoundingClientRect();
    return [
      Math.round(((e.clientX - rect.left) / rect.width) * canvas.width),
      Math.round(((e.clientY - rect.top) / rect.height) * canvas.height),
    ];
  };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const erasing = el('sketch-eraser').getAttribute('aria-pressed') === 'true';
    const width = Number(el<HTMLInputElement>('sketch-width').value);
    current = {
      color: erasing ? '#ffffff' : el<HTMLSelectElement>('sketch-color').value,
      width: erasing ? width * 4 : width,
      points: [pos(e)],
    };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!current) return;
    current.points.push(pos(e));
    redraw(ctx, canvas, [...strokes, current]);
  });
  canvas.addEventListener('pointerup', () => {
    if (current && current.points.length > 1) strokes.push(current);
    current = null;
    redraw(ctx, canvas, strokes);
  });

  el('sketch-eraser').addEventListener('click', (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });
  el('sketch-undo').addEventListener('click', () => {
    strokes.pop();
    redraw(ctx, canvas, strokes);
  });
  el('editor-sketch').addEventListener('click', () => {
    editingName = null;
    strokes = [];
    redraw(ctx, canvas, strokes);
    el('sketch-overlay').hidden = false;
  });
  el('sketch-close').addEventListener('click', () => {
    el('sketch-overlay').hidden = true;
  });
  el('sketch-save').addEventListener('click', () => void save(conceptPath, canvas));

  // 미리보기에서 스케치 이미지를 탭하면 이어 그리기 (editor.ts가 발신)
  document.addEventListener('sketch:open', (e) => {
    void openExisting((e as CustomEvent<string>).detail, ctx, canvas);
  });
}

function redraw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, all: Stroke[]): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const s of all) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    s.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
  }
}

async function save(conceptPath: string, canvas: HTMLCanvasElement): Promise<void> {
  const token = getToken();
  if (!token) return;
  const status = el('editor-status');
  const input = el<HTMLTextAreaElement>('editor-input');

  const isNew = editingName === null;
  const name = editingName ?? `sketch-${Date.now()}`;
  const pngPath = sketchFilePath(conceptPath, `${name}.png`);
  const jsonPath = sketchFilePath(conceptPath, `${name}.json`);
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];

  status.textContent = '스케치 저장 중…';
  try {
    const pngSha = (await getSha(token, pngPath)) ?? undefined;
    await putFile(token, pngPath, { message: `sketch: ${conceptPath} 스케치 저장`, base64, sha: pngSha });
    const jsonSha = (await getSha(token, jsonPath)) ?? undefined;
    await putFile(token, jsonPath, {
      message: `sketch: ${conceptPath} 스케치 원본 저장`,
      text: JSON.stringify(strokes),
      sha: jsonSha,
    });

    const url = sketchUrl(conceptPath, `${name}.png`);
    registerSessionImage(url, dataUrl);
    sessionStrokes.set(url, [...strokes]);
    if (isNew) insertAtCursor(input, `\n![스케치](${url})\n`);
    else input.dispatchEvent(new Event('input')); // 미리보기 dataURL 갱신
    editingName = name;
    el('sketch-overlay').hidden = true;
    status.textContent = '스케치 저장됨 ✓ — 노트도 저장해야 글에 반영됩니다.';
  } catch {
    status.textContent = '스케치 저장 실패 — 다시 시도하세요.';
  }
}

function insertAtCursor(input: HTMLTextAreaElement, text: string): void {
  const start = input.selectionStart ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(start);
  input.dispatchEvent(new Event('input'));
}

async function openExisting(
  src: string,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): Promise<void> {
  editingName = src.split('/').pop()!.replace(/\.png$/, '');
  const known = sessionStrokes.get(src);
  if (known) {
    strokes = [...known];
  } else {
    try {
      const res = await fetch(src.replace(/\.png$/, '.json'));
      strokes = res.ok ? ((await res.json()) as Stroke[]) : [];
    } catch {
      strokes = [];
    }
  }
  redraw(ctx, canvas, strokes);
  el('sketch-overlay').hidden = false;
}
```

- [ ] **Step 2: EditUI.astro script 블록 갱신** — 기존 script 블록을 아래로 교체

```astro
<script>
  import { initEditUI } from '../lib/client/editor';
  import { initSketch } from '../lib/client/sketch';
  initEditUI();
  initSketch();
</script>
```

- [ ] **Step 3: e2e 작성** — `e2e/sketch.spec.ts`

```ts
import { test, expect } from '@playwright/test';

const NOTE_MD = '---\nupdated: 2026-08-08\n---\n\n기존 노트 내용입니다.\n';

function b64(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64');
}

test('스케치를 그려 저장하면 PNG·JSON 커밋과 마크다운 삽입이 일어난다', async ({ page }) => {
  const puts: string[] = [];
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && req.url().includes('my-note.md')) {
      await route.fulfill({ json: { content: b64(NOTE_MD), sha: 'sha-old' } });
    } else if (req.method() === 'GET') {
      await route.fulfill({ status: 404, json: {} }); // 스케치 sha 조회 → 신규
    } else if (req.method() === 'PUT') {
      puts.push(req.url());
      await route.fulfill({ json: { content: { sha: `sha-${puts.length}` } } });
    } else {
      await route.fulfill({ status: 404, json: {} });
    }
  });
  await page.addInitScript(() => localStorage.setItem('concept-notes:token', 'test-token'));

  await page.goto('math/middle/functions/linear-function/');
  await page.locator('#edit-enter').click();
  await page.locator('#edit-note').click();
  await page.locator('#editor-sketch').click();

  const canvas = page.locator('#sketch-canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 50, box.y + 50);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 150, { steps: 5 });
  await page.mouse.up();
  await page.locator('#sketch-save').click();

  await expect(page.locator('#editor-status')).toContainText('스케치 저장됨');
  expect(puts.some((u) => u.includes('/contents/public/sketches/') && u.endsWith('.png'))).toBe(true);
  expect(puts.some((u) => u.includes('/contents/public/sketches/') && u.endsWith('.json'))).toBe(true);
  await expect(page.locator('#editor-input')).toHaveValue(/!\[스케치\]\(\/concept-notes\/sketches\//);
  // 미리보기에는 세션 dataURL로 즉시 표시
  await expect(page.locator('#editor-preview img')).toHaveAttribute('src', /^data:image\/png/);
});

test('지우개·되돌리기 버튼이 동작한다 (UI 상태)', async ({ page }) => {
  await page.route('https://api.github.com/**', async (route) => {
    if (route.request().url().includes('my-note.md')) {
      await route.fulfill({ json: { content: b64(NOTE_MD), sha: 'sha-old' } });
    } else {
      await route.fulfill({ status: 404, json: {} });
    }
  });
  await page.addInitScript(() => localStorage.setItem('concept-notes:token', 'test-token'));

  await page.goto('math/middle/functions/linear-function/');
  await page.locator('#edit-enter').click();
  await page.locator('#edit-note').click();
  await page.locator('#editor-sketch').click();

  const eraser = page.locator('#sketch-eraser');
  await expect(eraser).toHaveAttribute('aria-pressed', 'false');
  await eraser.click();
  await expect(eraser).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#sketch-undo').click(); // 빈 상태에서도 에러 없이 동작
  await page.locator('#sketch-close').click();
  await expect(page.locator('#sketch-overlay')).toBeHidden();
});
```

- [ ] **Step 4: 테스트 실행**

Run: `npm run build && npx playwright test`
Expected: 8 passed (스모크 3 + 편집 3 + 스케치 2)

Run: `npx vitest run`
Expected: 21건 통과 (회귀)

- [ ] **Step 5: Commit**

```bash
git add src/lib/client/sketch.ts src/components/EditUI.astro e2e/sketch.spec.ts
git commit -m "feat: 스케치 캔버스 — 그리기·저장·이어 그리기

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 스펙 문서 반영 + 배포

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-concept-notes-design.md` (스케치 저장 위치)
- Modify: `README.md` (편집 기능 한 줄)

- [ ] **Step 1: 스펙 §4의 스케치 설명 수정** — 아래 줄을:

```
          sketches/        ← 스케치 이미지(PNG) + 원본 스트로크 데이터(JSON)
```

이렇게 교체:

```
          (스케치는 public/sketches/<개념경로>/에 저장 — 2단계 구현 시 조정)
```

그리고 §6 스케치 입력 문단 끝에 한 문장 추가:

```
스케치 파일(PNG + 스트로크 JSON)은 Astro 이미지 최적화가 `src/` 외부 상대 경로를 보장하지 않으므로 `public/sketches/<개념경로>/`에 저장하고, 노트에는 base 포함 절대 경로로 삽입한다.
```

- [ ] **Step 2: README 특징 목록에 한 줄 추가** — "**특징**:" 줄을 아래로 교체:

```
- **특징**: 초→중→고 개념 연결 경로, LaTeX 수식(KaTeX), 태블릿 반응형, 소유자 편집 모드(마크다운 + 손 스케치, GitHub 커밋으로 저장).
```

- [ ] **Step 3: 최종 회귀 전체 실행**

Run: `npx vitest run && npm run build && npx playwright test`
Expected: 21건 / 빌드 성공 / 8건 — 전부 통과

- [ ] **Step 4: Commit + main 병합·배포**

```bash
git add docs/superpowers/specs/2026-08-07-concept-notes-design.md README.md
git commit -m "docs: 스케치 저장 위치 조정 반영 및 README 갱신

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feature/stage2-editing
git push origin main
```

- [ ] **Step 5: 배포 확인**

Run: `gh run watch $(gh run list --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId') --exit-status`
Expected: 성공

Run: `curl -s -o /dev/null -w "%{http_code}" https://minomidev-lab.github.io/concept-notes/math/middle/functions/linear-function/`
Expected: `200`

- [ ] **Step 6: 사용자 안내 출력** — 실기기에서 쓰려면 fine-grained PAT가 필요하다. 다음 안내를 사용자에게 전달:

> GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
> Repository access: **Only select repositories → concept-notes**. Permissions: **Contents → Read and write**.
> 발급된 토큰을 사이트의 "✏️ 편집" 버튼을 눌러 나오는 입력창에 붙여넣으면 그 기기에서 편집 모드가 열립니다.

---

## 완료 기준 (2단계 성공 검증)

- [ ] `npx vitest run` — 21건 통과 (기존 7 + textfile 7 + github 7)
- [ ] `npx playwright test` — 8건 통과 (스모크 3 + 편집 3 + 스케치 2), 전부 GitHub API 모킹으로 실토큰 없이 동작
- [ ] 편집 모드: 토큰 없으면 편집 UI 미노출, 저장 시 my-note.md frontmatter의 updated 자동 갱신, concept.md frontmatter 보존
- [ ] 충돌(409) 시 덮어쓰기 확인 흐름 동작
- [ ] 저장 실패 시 초안이 localStorage에 보존됨
- [ ] 배포 후 실제 사이트에서 편집 버튼 노출 확인
- [ ] 3단계 범위(giscus 댓글, 콘텐츠 확장)는 포함하지 않음

## 다음 단계 메모

- 3단계: giscus 댓글 + 4과목 콘텐츠 확장 (Claude 초안 생성) — 별도 계획
- 알려진 한계(의도된 범위 제외): 오프라인 편집 불가, 스케치는 새로 그리기·이어 그리기만(회전·이동 등 편집 도구 없음), concept.md frontmatter는 에디터에서 수정 불가(prev/next 변경은 Claude를 통해)
