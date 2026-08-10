const THEME_KEY = 'concept-notes:theme';

type Theme = 'light' | 'dark';

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function effectiveTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme | undefined) ?? systemTheme();
}

/** giscus 댓글 iframe의 테마를 사이트와 동기화 */
function syncGiscus(theme: Theme): void {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
  iframe?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app');
}

export function initTheme(): void {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const paint = () => {
    const dark = effectiveTheme() === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
  };
  paint();

  btn.addEventListener('click', () => {
    const next: Theme = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    paint();
    syncGiscus(next);
  });

  // 명시적 선택이 저장돼 있으면, 늦게 뜨는 giscus iframe에도 몇 차례 동기화 시도
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored) {
    let tries = 0;
    const timer = setInterval(() => {
      syncGiscus(stored);
      if (++tries >= 10) clearInterval(timer);
    }, 500);
  }
}
