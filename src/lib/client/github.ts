import { encodeBase64, decodeBase64 } from './textfile';
import { REPO } from './config';

export class AuthError extends Error {}
export class ConflictError extends Error {}

export interface RepoFile { text: string; sha: string }

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function contentsUrl(path: string): string {
  return `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${path}`;
}

function throwByStatus(status: number, action: string): never {
  if (status === 401 || status === 403) throw new AuthError(`GitHub 인증 실패 (${status})`);
  if (status === 409 || status === 422) throw new ConflictError('원격에 더 새로운 버전이 있습니다.');
  throw new Error(`GitHub ${action} 실패 (${status})`);
}

export async function getFile(token: string, path: string): Promise<RepoFile | null> {
  const res = await fetch(`${contentsUrl(path)}?ref=${REPO.branch}`, { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) throwByStatus(res.status, '조회');
  const json = await res.json();
  return { text: decodeBase64(json.content), sha: json.sha };
}

/** 바이너리 파일 등 sha만 필요할 때 (없으면 null) */
export async function getSha(token: string, path: string): Promise<string | null> {
  const res = await fetch(`${contentsUrl(path)}?ref=${REPO.branch}`, { headers: headers(token) });
  if (!res.ok) return null;
  const json = await res.json();
  return json.sha ?? null;
}

export interface PutOptions {
  message: string;
  /** 텍스트 파일이면 text, 바이너리면 base64 중 하나 */
  text?: string;
  base64?: string;
  /** 기존 파일 갱신 시 필수. 생략하면 신규 생성 */
  sha?: string;
}

export async function putFile(
  token: string,
  path: string,
  opts: PutOptions,
): Promise<{ sha: string }> {
  const content = opts.base64 ?? encodeBase64(opts.text ?? '');
  const res = await fetch(contentsUrl(path), {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message: opts.message,
      content,
      branch: REPO.branch,
      ...(opts.sha ? { sha: opts.sha } : {}),
    }),
  });
  if (!res.ok) throwByStatus(res.status, '저장');
  const json = await res.json();
  return { sha: json.content.sha };
}
