import { test, expect } from '@playwright/test';

const NOTE_MD = '---\nupdated: 2026-08-08\n---\n\n기존 노트 내용입니다.\n';

function b64(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64');
}

test('토큰이 없으면 자체 인증 다이얼로그가 뜨고, 닫으면 편집 모드가 아니다', async ({ page }) => {
  await page.goto('math/middle/functions/linear-function/');
  await page.locator('#edit-enter').click();
  // window.prompt가 아니라 페이지 자체 다이얼로그여야 한다 (prompt는 차단 환경에서 무반응)
  await expect(page.locator('#token-overlay')).toBeVisible();
  await expect(page.locator('#token-overlay a[href*="personal-access-tokens"]')).toBeVisible();
  await page.locator('#token-close').click();
  await expect(page.locator('#token-overlay')).toBeHidden();
  await expect(page.locator('#edit-note')).toBeHidden();
});

test('다이얼로그에서 토큰을 저장하면 편집 모드로 들어간다', async ({ page }) => {
  await page.goto('math/middle/functions/linear-function/');
  await page.locator('#edit-enter').click();
  await page.locator('#token-input').fill('github_pat_test123');
  await page.locator('#token-save').click();
  await expect(page.locator('#token-overlay')).toBeHidden();
  await expect(page.locator('#edit-note')).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('concept-notes:token'));
  expect(stored).toBe('github_pat_test123');
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

  await page.goto('math/middle/functions/linear-function/');
  await page.locator('#edit-enter').click();
  await page.locator('#edit-note').click();
  await page.locator('#editor-input').fill('충돌 테스트 본문');
  await page.locator('#editor-save').click();

  // window.confirm이 아니라 자체 확인 다이얼로그가 떠야 한다 (confirm은 차단 환경에서 false 고정)
  await expect(page.locator('#confirm-overlay')).toBeVisible();
  await expect(page.locator('#confirm-message')).toContainText('더 새로운 버전');
  await page.locator('#confirm-ok').click();

  await expect(page.locator('#editor-status')).toContainText('저장됨');
  expect(putCount).toBe(2);
});

test('저장 충돌 시 취소하면 덮어쓰지 않고 초안이 남는다', async ({ page }) => {
  let putCount = 0;
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && req.url().includes('my-note.md')) {
      await route.fulfill({ json: { content: b64(NOTE_MD), sha: 'sha-old' } });
    } else if (req.method() === 'PUT') {
      putCount += 1;
      await route.fulfill({ status: 409, json: { message: 'conflict' } });
    } else {
      await route.fulfill({ status: 404, json: {} });
    }
  });
  await page.addInitScript(() => localStorage.setItem('concept-notes:token', 'test-token'));

  await page.goto('math/middle/functions/linear-function/');
  await page.locator('#edit-enter').click();
  await page.locator('#edit-note').click();
  await page.locator('#editor-input').fill('충돌 취소 테스트 본문');
  await page.locator('#editor-save').click();

  await expect(page.locator('#confirm-overlay')).toBeVisible();
  await page.locator('#confirm-cancel').click();
  await expect(page.locator('#confirm-overlay')).toBeHidden();

  await expect(page.locator('#editor-status')).toContainText('저장 취소됨');
  expect(putCount).toBe(1);
});

test('저장되지 않은 초안이 있으면 자체 다이얼로그로 물어보고 불러온다', async ({ page }) => {
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && req.url().includes('my-note.md')) {
      await route.fulfill({ json: { content: b64(NOTE_MD), sha: 'sha-old' } });
    } else {
      await route.fulfill({ status: 404, json: {} });
    }
  });
  await page.addInitScript(() => localStorage.setItem('concept-notes:token', 'test-token'));

  await page.goto('math/middle/functions/linear-function/');
  await page.evaluate(() => {
    const path = document.getElementById('edit-root')!.dataset.conceptPath!;
    localStorage.setItem(`concept-notes:draft:note:${path}`, '기기에 남아 있던 초안입니다.');
  });
  await page.locator('#edit-enter').click();
  await page.locator('#edit-note').click();

  await expect(page.locator('#confirm-overlay')).toBeVisible();
  await expect(page.locator('#confirm-message')).toContainText('초안');
  await page.locator('#confirm-ok').click();

  await expect(page.locator('#editor-input')).toHaveValue('기기에 남아 있던 초안입니다.');
});
