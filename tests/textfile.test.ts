import { describe, it, expect } from 'vitest';
import {
  encodeBase64, decodeBase64, splitFrontmatter, joinFrontmatter, noteFrontmatter,
} from '../src/lib/client/textfile';

describe('base64 (UTF-8 안전)', () => {
  it('한국어·수식 텍스트를 왕복 변환한다', () => {
    const text = '기울기 $a$는 **변화 속도**다.\n$y = ax + b$';
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it('개행이 섞인 base64도 디코딩한다 (GitHub API 응답 형태)', () => {
    const b64 = encodeBase64('안녕하세요');
    const wrapped = b64.slice(0, 4) + '\n' + b64.slice(4);
    expect(decodeBase64(wrapped)).toBe('안녕하세요');
  });
});

describe('frontmatter 분리/결합', () => {
  it('frontmatter와 본문을 분리한다', () => {
    const doc = '---\nupdated: 2026-08-08\n---\n\n본문입니다.\n';
    expect(splitFrontmatter(doc)).toEqual({
      frontmatter: '---\nupdated: 2026-08-08\n---\n',
      body: '본문입니다.\n',
    });
  });

  it('CRLF 문서도 분리한다', () => {
    const doc = '---\r\nupdated: 2026-08-08\r\n---\r\n\r\n본문';
    expect(splitFrontmatter(doc).body).toBe('본문');
  });

  it('frontmatter가 없으면 전체가 본문이다', () => {
    expect(splitFrontmatter('그냥 본문')).toEqual({ frontmatter: '', body: '그냥 본문' });
  });

  it('joinFrontmatter는 빈 줄 하나로 이어 붙이고 개행으로 끝낸다', () => {
    expect(joinFrontmatter('---\ntitle: x\n---\n', '본문')).toBe('---\ntitle: x\n---\n\n본문\n');
  });

  it('frontmatter가 비면 본문만 반환한다', () => {
    expect(joinFrontmatter('', '본문')).toBe('본문');
  });

  it('noteFrontmatter는 updated 날짜를 넣는다', () => {
    expect(noteFrontmatter('2026-08-08')).toBe('---\nupdated: 2026-08-08\n---\n');
  });
});
