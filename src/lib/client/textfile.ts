export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function decodeBase64(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export interface SplitDoc { frontmatter: string; body: string }

export function splitFrontmatter(text: string): SplitDoc {
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!match) return { frontmatter: '', body: text };
  return { frontmatter: match[0], body: text.slice(match[0].length).replace(/^\r?\n/, '') };
}

export function joinFrontmatter(frontmatter: string, body: string): string {
  if (!frontmatter) return body;
  return `${frontmatter}\n${body}\n`;
}

/** my-note.md 저장 시 updated를 오늘 날짜로 새로 쓴다 */
export function noteFrontmatter(dateIso: string): string {
  return `---\nupdated: ${dateIso}\n---\n`;
}
