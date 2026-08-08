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

// window.confirm도 prompt처럼 차단 환경에서 무반응(false 고정)이라 자체 다이얼로그를 쓴다
let confirmResolve: ((ok: boolean) => void) | null = null;

function confirmDialog(message: string): Promise<boolean> {
  el('confirm-message').textContent = message;
  el('confirm-overlay').hidden = false;
  el('confirm-ok').focus();
  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

function closeConfirm(ok: boolean): void {
  el('confirm-overlay').hidden = true;
  confirmResolve?.(ok);
  confirmResolve = null;
}

export function initEditUI(): void {
  const root = document.getElementById('edit-root');
  if (!root) return;
  const conceptPath = root.dataset.conceptPath!;

  // window.prompt는 태블릿·임베디드 브라우저에서 차단될 수 있어 자체 다이얼로그를 쓴다
  el('edit-enter').addEventListener('click', () => {
    if (!getToken()) {
      el('token-overlay').hidden = false;
      el<HTMLInputElement>('token-input').focus();
      return;
    }
    document.body.classList.toggle('editing');
  });

  el('token-close').addEventListener('click', () => {
    el('token-overlay').hidden = true;
  });

  el('confirm-ok').addEventListener('click', () => closeConfirm(true));
  el('confirm-cancel').addEventListener('click', () => closeConfirm(false));

  el('token-save').addEventListener('click', () => {
    const value = el<HTMLInputElement>('token-input').value.trim();
    if (!value) {
      el<HTMLInputElement>('token-input').focus();
      return;
    }
    setToken(value);
    el<HTMLInputElement>('token-input').value = '';
    el('token-overlay').hidden = true;
    document.body.classList.add('editing');
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
    if (draft !== null && draft !== body && (await confirmDialog('저장되지 않은 초안이 있습니다. 불러올까요?'))) {
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
      if (await confirmDialog('원격에 더 새로운 버전이 있습니다. 덮어쓸까요?')) {
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
