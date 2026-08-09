interface IndexItem {
  path: string;
  title: string;
  crumb: string;
  text: string;
}

let index: IndexItem[] | null = null;

function base(): string {
  return import.meta.env.BASE_URL.replace(/\/+$/, '');
}

async function loadIndex(): Promise<IndexItem[]> {
  if (!index) {
    const res = await fetch(`${base()}/search-index.json`);
    index = (await res.json()) as IndexItem[];
  }
  return index;
}

/** 제목 일치 > 분류 일치 > 본문 일치 순으로 상위 12개 */
function filter(items: IndexItem[], query: string): IndexItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const ranked = items
    .map((item) => {
      if (item.title.toLowerCase().includes(q)) return { item, rank: 0 };
      if (item.crumb.toLowerCase().includes(q)) return { item, rank: 1 };
      if (item.text.toLowerCase().includes(q)) return { item, rank: 2 };
      return null;
    })
    .filter((r): r is { item: IndexItem; rank: number } => r !== null);
  ranked.sort((a, b) => a.rank - b.rank || a.item.title.localeCompare(b.item.title, 'ko'));
  return ranked.slice(0, 12).map((r) => r.item);
}

export function initSearch(): void {
  const openBtn = document.getElementById('search-open');
  if (!openBtn) return;
  const overlay = document.getElementById('search-overlay')!;
  const input = document.getElementById('search-input') as HTMLInputElement;
  const results = document.getElementById('search-results')!;

  const render = (items: IndexItem[], query: string) => {
    if (!query.trim()) {
      results.innerHTML = '<li class="search-hint">개념 이름이나 키워드를 입력하세요.</li>';
      return;
    }
    if (items.length === 0) {
      results.innerHTML = '<li class="search-hint">결과가 없습니다.</li>';
      return;
    }
    results.innerHTML = items
      .map(
        (item) =>
          `<li><a href="${base()}/${item.path}/">` +
          `<span class="search-title">${item.title}</span>` +
          `<span class="search-crumb">${item.crumb}</span></a></li>`,
      )
      .join('');
  };

  const open = () => {
    overlay.hidden = false;
    input.value = '';
    render([], '');
    input.focus();
    void loadIndex();
  };
  const close = () => {
    overlay.hidden = true;
  };

  openBtn.addEventListener('click', open);
  document.getElementById('search-close')?.addEventListener('click', close);

  input.addEventListener('input', async () => {
    const items = await loadIndex();
    render(filter(items, input.value), input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      const first = results.querySelector('a');
      if (first) (first as HTMLAnchorElement).click();
    }
  });
}
