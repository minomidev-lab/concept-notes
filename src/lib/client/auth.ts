const TOKEN_KEY = 'concept-notes:token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

/** 인증 실패 시 지워서, 다음 ✏️ 편집 클릭에서 재입력 프롬프트가 뜨게 한다 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
