export const REPO = { owner: 'minomidev-lab', repo: 'concept-notes', branch: 'main' } as const;

export function myNotePath(conceptPath: string): string {
  return `content/${conceptPath}/my-note.md`;
}

export function conceptFilePath(conceptPath: string): string {
  return `content/${conceptPath}/concept.md`;
}

/** 저장소 안의 스케치 파일 경로 (커밋 대상) */
export function sketchFilePath(conceptPath: string, fileName: string): string {
  return `public/sketches/${conceptPath}/${fileName}`;
}

/** 사이트에서 스케치가 서빙되는 절대 URL (마크다운에 삽입) */
export function sketchUrl(conceptPath: string, fileName: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/sketches/${conceptPath}/${fileName}`;
}
