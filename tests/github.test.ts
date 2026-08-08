import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFile, getSha, putFile, AuthError, ConflictError } from '../src/lib/client/github';
import { encodeBase64 } from '../src/lib/client/textfile';

function mockFetchOnce(status: number, json: unknown): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => vi.unstubAllGlobals());

describe('getFile', () => {
  it('본문을 디코딩하고 sha를 돌려준다', async () => {
    const fn = mockFetchOnce(200, { content: encodeBase64('본문 텍스트'), sha: 'abc' });
    const file = await getFile('tok', 'content/x/my-note.md');
    expect(file).toEqual({ text: '본문 텍스트', sha: 'abc' });
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe(
      'https://api.github.com/repos/minomidev-lab/concept-notes/contents/content/x/my-note.md?ref=main',
    );
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('404면 null (신규 파일)', async () => {
    mockFetchOnce(404, { message: 'Not Found' });
    expect(await getFile('tok', 'content/x/my-note.md')).toBeNull();
  });

  it('401이면 AuthError', async () => {
    mockFetchOnce(401, { message: 'Bad credentials' });
    await expect(getFile('tok', 'p')).rejects.toBeInstanceOf(AuthError);
  });
});

describe('getSha', () => {
  it('sha만 돌려주고 없으면 null', async () => {
    mockFetchOnce(200, { sha: 'xyz', content: 'ignored' });
    expect(await getSha('tok', 'public/sketches/a/b.png')).toBe('xyz');
    mockFetchOnce(404, {});
    expect(await getSha('tok', 'none')).toBeNull();
  });
});

describe('putFile', () => {
  it('텍스트를 base64로 커밋하고 새 sha를 돌려준다', async () => {
    const fn = mockFetchOnce(201, { content: { sha: 'new-sha' } });
    const result = await putFile('tok', 'content/x/my-note.md', {
      message: 'note: 수정', text: '새 본문', sha: 'old-sha',
    });
    expect(result).toEqual({ sha: 'new-sha' });
    const body = JSON.parse(fn.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ message: 'note: 수정', branch: 'main', sha: 'old-sha' });
    expect(body.content).toBe(encodeBase64('새 본문'));
  });

  it('sha 없이 호출하면 body에 sha를 넣지 않는다 (신규 생성)', async () => {
    const fn = mockFetchOnce(201, { content: { sha: 's' } });
    await putFile('tok', 'p', { message: 'm', text: 't' });
    expect('sha' in JSON.parse(fn.mock.calls[0][1].body as string)).toBe(false);
  });

  it('409/422는 ConflictError', async () => {
    mockFetchOnce(409, { message: 'conflict' });
    await expect(putFile('tok', 'p', { message: 'm', text: 't' })).rejects.toBeInstanceOf(ConflictError);
  });
});
