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
