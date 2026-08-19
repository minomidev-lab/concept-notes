export type Level = 'elementary' | 'middle' | 'high';

export interface ConceptLeaf {
  /** 개념 폴더 경로 = 컬렉션 엔트리 id. 예: 'math/middle/functions/linear-function' */
  path: string;
  title: string;
  order: number;
  /** '나의 이해'(my-note.md)가 작성된 개념인지 — 사이드바 진행 표시용 */
  hasNote?: boolean;
}

export interface UnitNode { slug: string; label: string; concepts: ConceptLeaf[] }
export interface LevelNode { slug: Level; label: string; units: UnitNode[] }
export interface SubjectNode { slug: string; label: string; levels: LevelNode[] }

export interface ConceptRef { path: string; title: string; level: Level }

const SUBJECT_ORDER = ['math', 'science', 'korean', 'english', 'social', 'kmo', 'kjso'];
const LEVEL_ORDER: Level[] = ['elementary', 'middle', 'high'];

function labelOf(slug: string, labels: Record<string, string>): string {
  const label = labels[slug];
  if (!label) throw new Error(`content/labels.json에 '${slug}' 라벨이 없습니다.`);
  return label;
}

/** 단원(unit) 순서는 입력 leaves의 등장 순서를 따른다 — 교육과정 순서를 보장하지 않으므로 정렬은 호출자 책임이다. */
export function buildTree(leaves: ConceptLeaf[], labels: Record<string, string>): SubjectNode[] {
  // subject → level → unit → leaves 중첩 그룹핑
  const grouped = new Map<string, Map<Level, Map<string, ConceptLeaf[]>>>();

  for (const leaf of leaves) {
    const parts = leaf.path.split('/');
    if (parts.length !== 4) {
      throw new Error(`잘못된 개념 경로 '${leaf.path}': 과목/학교급/단원/개념의 4단계여야 합니다.`);
    }
    const [subject, level, unit] = parts;
    if (!SUBJECT_ORDER.includes(subject)) {
      throw new Error(`알 수 없는 과목 '${subject}' (${leaf.path})`);
    }
    if (!LEVEL_ORDER.includes(level as Level)) {
      throw new Error(`알 수 없는 학교급 '${level}' (${leaf.path})`);
    }
    const levelsMap = grouped.get(subject) ?? new Map<Level, Map<string, ConceptLeaf[]>>();
    const unitsMap = levelsMap.get(level as Level) ?? new Map<string, ConceptLeaf[]>();
    const unitLeaves = unitsMap.get(unit) ?? [];
    unitLeaves.push(leaf);
    unitsMap.set(unit, unitLeaves);
    levelsMap.set(level as Level, unitsMap);
    grouped.set(subject, levelsMap);
  }

  return SUBJECT_ORDER.filter((s) => grouped.has(s)).map((subject) => ({
    slug: subject,
    label: labelOf(subject, labels),
    levels: LEVEL_ORDER.filter((l) => grouped.get(subject)!.has(l)).map((level) => ({
      slug: level,
      label: labelOf(level, labels),
      units: [...grouped.get(subject)!.get(level)!.entries()].map(([unitSlug, unitLeaves]) => ({
        slug: unitSlug,
        label: labelOf(unitSlug, labels),
        concepts: [...unitLeaves].sort(
          (a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ko'),
        ),
      })),
    })),
  }));
}

export function resolveRefs(
  paths: string[],
  lookup: Map<string, { title: string; level: Level }>,
  fromId: string,
): ConceptRef[] {
  return paths.map((path) => {
    const hit = lookup.get(path);
    if (!hit) {
      throw new Error(`'${fromId}'의 prev/next가 가리키는 '${path}'을(를) 찾을 수 없습니다.`);
    }
    return { path, title: hit.title, level: hit.level };
  });
}
