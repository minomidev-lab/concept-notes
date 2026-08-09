import { getCollection } from 'astro:content';
import labelsJson from '../../content/labels.json';

const labels = labelsJson as Record<string, string>;

/** 빌드 시 생성되는 검색 색인 — 클라이언트가 한 번 받아 즉시 필터링한다 */
export async function GET() {
  const concepts = await getCollection('concepts');
  const items = concepts.map((c) => {
    const [subject, level, unit] = c.id.split('/');
    return {
      path: c.id,
      title: c.data.title,
      crumb: `${labels[subject] ?? subject} · ${labels[level] ?? level} · ${labels[unit] ?? unit}`,
      text: (c.body ?? '').replace(/[\s#>*|$\\{}-]+/g, ' ').slice(0, 300),
    };
  });
  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
