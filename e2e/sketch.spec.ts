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
