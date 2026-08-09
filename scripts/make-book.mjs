import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { convertMarkdown } from './lib/md-to-typst.mjs';

const SUBJECT_ORDER = ['math', 'science', 'korean', 'english', 'social', 'kmo'];
const LEVEL_ORDER = ['elementary', 'middle', 'high'];

// ---- CLI 인자 ----
const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
};
const subjects = (getArg('subjects') ?? SUBJECT_ORDER.join(','))
  .split(',').map((s) => s.trim()).filter(Boolean);
const includeNotes = args.includes('--include-notes');
const outName = getArg('out') ?? 'concept-notes.pdf';
const typstBin = getArg('typst') ?? 'typst';

// ---- 콘텐츠 수집 ----
const labels = JSON.parse(fs.readFileSync('content/labels.json', 'utf-8'));
const label = (slug) => labels[slug] ?? slug;

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  return { data, body: text.slice(m[0].length) };
}

const imageExists = (rootAbsPath) => fs.existsSync(rootAbsPath.replace(/^\//, ''));

const chapters = []; // { subject, concepts: [{ title, level, unit, body, note }] }
for (const subject of SUBJECT_ORDER.filter((s) => subjects.includes(s))) {
  const concepts = [];
  for (const level of LEVEL_ORDER) {
    const levelDir = `content/${subject}/${level}`;
    if (!fs.existsSync(levelDir)) continue;
    for (const unit of fs.readdirSync(levelDir)) {
      const unitDir = `${levelDir}/${unit}`;
      if (!fs.statSync(unitDir).isDirectory()) continue;
      const unitConcepts = [];
      for (const slug of fs.readdirSync(unitDir)) {
        const conceptFile = `${unitDir}/${slug}/concept.md`;
        if (!fs.existsSync(conceptFile)) continue;
        const { data, body } = parseFrontmatter(fs.readFileSync(conceptFile, 'utf-8'));
        const noteFile = `${unitDir}/${slug}/my-note.md`;
        const note = includeNotes && fs.existsSync(noteFile)
          ? parseFrontmatter(fs.readFileSync(noteFile, 'utf-8')).body
          : null;
        unitConcepts.push({
          title: data.title ?? slug,
          order: Number(data.order ?? 0),
          level, unit, body, note,
        });
      }
      unitConcepts.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ko'));
      concepts.push(...unitConcepts);
    }
  }
  if (concepts.length > 0) chapters.push({ subject, concepts });
}

if (chapters.length === 0) {
  console.error(`선택한 과목(${subjects.join(', ')})에 개념이 없습니다.`);
  process.exit(1);
}

// ---- Typst 문서 생성 ----
const typ = [];
typ.push('#import "@preview/mitex:0.2.7": *'); // 0.2.5는 typst 0.15와 비호환
typ.push('#set text(font: "Malgun Gothic", size: 10.5pt, lang: "ko")');
typ.push('#set page(paper: "a4", margin: (x: 2.2cm, y: 2.6cm), numbering: "1")');
typ.push('#set heading(numbering: "1.1")');

typ.push('#page(numbering: none)[#align(center + horizon)[');
typ.push('#text(30pt, weight: "bold")[나만의 개념노트]');
typ.push('#v(1em)');
typ.push(`#text(14pt)[${chapters.map((c) => label(c.subject)).join(' · ')}]`);
typ.push('#v(0.5em)');
typ.push(`#text(11pt, fill: gray)[${new Date().toISOString().slice(0, 10)}]`);
typ.push(']]');

typ.push('#outline(depth: 2, title: [목차])');
typ.push('#pagebreak()');

let first = true;
for (const chapter of chapters) {
  if (!first) typ.push('#pagebreak(weak: true)');
  first = false;
  typ.push(`= ${label(chapter.subject)}`);
  for (const c of chapter.concepts) {
    typ.push(`== ${c.title}`);
    typ.push(`#text(9pt, fill: gray)[${label(c.level)} · ${label(c.unit)}]`);
    typ.push(convertMarkdown(c.body, { imageExists }));
    if (c.note) {
      typ.push('#block(width: 100%, fill: rgb("fff5f8"), stroke: (left: 3pt + rgb("e9739a")), inset: 12pt, radius: 4pt)[');
      typ.push('#text(weight: "bold")[나의 이해]');
      typ.push('');
      typ.push(convertMarkdown(c.note, { imageExists }));
      typ.push(']');
    }
    typ.push('#v(1.5em)');
  }
}

fs.mkdirSync('book', { recursive: true });
fs.writeFileSync('book/book.typ', typ.join('\n\n'), 'utf-8');

// ---- 컴파일 ----
execFileSync(typstBin, ['compile', '--root', '.', 'book/book.typ', `book/${outName}`], { stdio: 'inherit' });
const total = chapters.reduce((n, ch) => n + ch.concepts.length, 0);
console.log(`✅ book/${outName} 생성 완료 (${chapters.length}개 과목, ${total}개 개념)`);
