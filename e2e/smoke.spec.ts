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
