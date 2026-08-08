import { describe, it, expect } from 'vitest';
import { convertMarkdown, convertInline, imagePathFromUrl } from '../scripts/lib/md-to-typst.mjs';

describe('convertInline', () => {
  it('굵게는 *…*로 변환한다', () => {
    expect(convertInline('**일차함수**라고 한다')).toBe('*일차함수*라고 한다');
  });

  it('기울임은 _…_로 변환한다', () => {
    expect(convertInline('*동생이* 먹는다')).toBe('_동생이_ 먹는다');
  });

  it('인라인 수식은 mitex mi로 감싼다 (LaTeX 원문 유지)', () => {
    expect(convertInline('기울기 $a$는 변화 속도다')).toBe('기울기 #mi(`a`)는 변화 속도다');
  });

  it('Typst 특수문자를 이스케이프한다', () => {
    expect(convertInline('번호 #1 와 밑줄_강조')).toBe('번호 \\#1 와 밑줄\\_강조');
  });
});

describe('convertMarkdown', () => {
  it('## 제목은 ===로 내려 변환한다 (책에서 과목=1, 개념=2레벨 사용)', () => {
    expect(convertMarkdown('## 정의')).toBe('=== 정의');
  });

  it('한 줄 블록 수식은 mitex로 감싼다', () => {
    expect(convertMarkdown('$$F = ma$$')).toBe('#mitex(`F = ma`)');
  });

  it('여러 줄 블록 수식도 처리한다', () => {
    expect(convertMarkdown('$$\nF = ma\n$$')).toBe('#mitex(`F = ma`)');
  });

  it('표를 #table로 변환한다 (구분선 행 제외)', () => {
    const md = '| 형식 | 예문 |\n|------|------|\n| 1형식 | Birds fly. |';
    expect(convertMarkdown(md)).toBe('#table(columns: 2, [형식], [예문], [1형식], [Birds fly.])');
  });

  it('스케치 이미지 URL을 로컬 경로로 매핑한다', () => {
    expect(imagePathFromUrl('/concept-notes/sketches/math/x/s.png')).toBe('/public/sketches/math/x/s.png');
    const md = '![스케치](/concept-notes/sketches/a/b.png)';
    expect(convertMarkdown(md, { imageExists: () => true })).toBe('#image("/public/sketches/a/b.png", width: 80%)');
  });

  it('이미지 파일이 없으면 안내 문구로 대체한다', () => {
    const md = '![스케치](/concept-notes/sketches/a/b.png)';
    expect(convertMarkdown(md, { imageExists: () => false })).toBe('(스케치 이미지 없음)');
  });
});
