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
