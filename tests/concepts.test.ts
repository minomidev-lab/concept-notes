import { describe, it, expect } from 'vitest';
import { buildTree, resolveRefs, type ConceptLeaf } from '../src/lib/concepts';

const labels: Record<string, string> = {
  math: '수학', science: '과학',
  elementary: '초등', middle: '중등',
  patterns: '규칙과 대응', functions: '함수',
};

const leaves: ConceptLeaf[] = [
  { path: 'math/middle/functions/quadratic-function', title: '이차함수', order: 2 },
  { path: 'math/middle/functions/linear-function', title: '일차함수', order: 1 },
  { path: 'math/elementary/patterns/rule-correspondence', title: '규칙과 대응', order: 1 },
];

describe('buildTree', () => {
  it('과목→학교급→단원→개념으로 묶고 한글 라벨을 붙인다', () => {
    const tree = buildTree(leaves, labels);
    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('math');
    expect(tree[0].label).toBe('수학');
    const levelSlugs = tree[0].levels.map((l) => l.slug);
    expect(levelSlugs).toEqual(['elementary', 'middle']); // 초→중→고 고정 순서
    const functionsUnit = tree[0].levels[1].units[0];
    expect(functionsUnit.label).toBe('함수');
    expect(functionsUnit.concepts.map((c) => c.title)).toEqual(['일차함수', '이차함수']); // order 순 정렬
  });

  it('4단계가 아닌 경로는 에러', () => {
    expect(() => buildTree([{ path: 'math/middle/linear-function', title: 'x', order: 0 }], labels))
      .toThrow(/4단계/);
  });

  it('라벨이 없는 slug는 에러', () => {
    expect(() => buildTree([{ path: 'math/middle/geometry/triangle', title: '삼각형', order: 0 }], labels))
      .toThrow(/geometry/);
  });

  it('order가 같으면 한국어 제목 localeCompare로 tie-break 정렬한다', () => {
    const tied: ConceptLeaf[] = [
      { path: 'math/middle/functions/quadratic-function', title: '이차함수', order: 1 },
      { path: 'math/middle/functions/linear-function', title: '일차함수', order: 1 },
    ];
    const tree = buildTree(tied, labels);
    const concepts = tree[0].levels[0].units[0].concepts;
    // localeCompare('ko')는 받침 없는 '이'가 받침 있는 '일'보다 앞선다고 판단한다.
    expect(concepts.map((c) => c.title)).toEqual(['이차함수', '일차함수']);
  });

  it('빈 배열을 넘기면 빈 트리를 반환한다', () => {
    expect(buildTree([], labels)).toEqual([]);
  });
});

describe('resolveRefs', () => {
  const lookup = new Map([
    ['math/middle/functions/linear-function', { title: '일차함수', level: 'middle' as const }],
  ]);

  it('경로를 제목·학교급으로 해석한다', () => {
    const refs = resolveRefs(['math/middle/functions/linear-function'], lookup, 'from-id');
    expect(refs).toEqual([
      { path: 'math/middle/functions/linear-function', title: '일차함수', level: 'middle' },
    ]);
  });

  it('없는 개념을 가리키면 출처와 대상이 담긴 에러', () => {
    expect(() => resolveRefs(['math/high/calculus/limit'], lookup, 'from-id'))
      .toThrow(/from-id.*math\/high\/calculus\/limit/);
  });
});
