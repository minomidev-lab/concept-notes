const SENTINEL = String.fromCharCode(0);

export function escapeTypst(text) {
  return text.replace(/[\\#$@<>*_~]/g, (c) => '\\' + c);
}

export function imagePathFromUrl(url) {
  // 노트 속 '/concept-notes/sketches/…' 절대 URL → typst --root . 기준 '/public/sketches/…'
  const m = url.match(/\/sketches\/(.+)$/);
  return m ? `/public/sketches/${m[1]}` : null;
}

/** 문단 내부: 수식·굵게·기울임을 토큰으로 빼내고 나머지를 이스케이프 */
export function convertInline(text) {
  const tokens = [];
  const put = (rendered) => {
    tokens.push(rendered);
    return `${SENTINEL}${tokens.length - 1}${SENTINEL}`;
  };
  let s = text;
  s = s.replace(/\$([^$]+)\$/g, (_, math) => put(`#mi(\`${math}\`)`));
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, t) => put(`*${escapeTypst(t)}*`));
  s = s.replace(/\*([^*]+)\*/g, (_, t) => put(`_${escapeTypst(t)}_`));
  s = escapeTypst(s);
  s = s.replace(new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, 'g'), (_, i) => tokens[Number(i)]);
  return s;
}

/** 마크다운 부분집합(제목·목록·표·수식·이미지·문단)을 Typst 마크업으로 변환 */
export function convertMarkdown(md, opts = {}) {
  const imageExists = opts.imageExists ?? (() => true);
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const singleMath = line.match(/^\s*\$\$(.+)\$\$\s*$/);
    if (singleMath) {
      out.push(`#mitex(\`${singleMath[1].trim()}\`)`);
      i += 1;
      continue;
    }
    if (/^\s*\$\$\s*$/.test(line)) {
      const buf = [];
      i += 1;
      while (i < lines.length && !/^\s*\$\$\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1; // 닫는 $$
      out.push(`#mitex(\`${buf.join('\n').trim()}\`)`);
      continue;
    }

    if (/^\s*\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = lines[i]
          .replace(/^\s*\|/, '')
          .replace(/\|\s*$/, '')
          .split('|')
          .map((c) => c.trim());
        if (!cells.every((c) => /^[-: ]*$/.test(c))) rows.push(cells); // 구분선 행 제외
        i += 1;
      }
      const cols = Math.max(...rows.map((r) => r.length));
      const cells = rows.flatMap((r) => {
        const padded = [...r];
        while (padded.length < cols) padded.push('');
        return padded.map((c) => `[${convertInline(c)}]`);
      });
      out.push(`#table(columns: ${cols}, ${cells.join(', ')})`);
      continue;
    }

    const img = line.match(/^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (img) {
      const path = imagePathFromUrl(img[2]);
      if (path && imageExists(path)) out.push(`#image("${path}", width: 80%)`);
      else out.push('(스케치 이미지 없음)');
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.*)$/);
    if (heading) {
      out.push(`${'='.repeat(heading[1].length + 1)} ${convertInline(heading[2])}`);
      i += 1;
      continue;
    }

    const listItem = line.match(/^(\s*)-\s+(.*)$/);
    if (listItem) {
      out.push(`${listItem[1]}- ${convertInline(listItem[2])}`);
      i += 1;
      continue;
    }

    out.push(convertInline(line));
    i += 1;
  }

  return out.join('\n').trim();
}
