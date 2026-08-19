import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { convertMarkdown } from './lib/md-to-typst.mjs';

const SUBJECT_ORDER = ['math', 'science', 'korean', 'english', 'social', 'kmo', 'kjso'];
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

// ---- 표지: 사이트와 같은 '따뜻한 종이 노트' 디자인 ----
const totalConcepts = chapters.reduce((n, ch) => n + ch.concepts.length, 0);
const unitCount = new Set(
  chapters.flatMap((ch) => ch.concepts.map((c) => `${ch.subject}/${c.unit}`)),
).size;
const subjectsLine = chapters.map((c) => label(c.subject)).join(' · ');
const today = new Date().toISOString().slice(0, 10);
typ.push(`#page(numbering: none, fill: rgb("faf6ec"))[#align(center + horizon)[
#box(stroke: 2pt + rgb("2f6b4f"), inset: 8pt, radius: 2pt)[
#box(stroke: 0.75pt + rgb("2f6b4f"), inset: (x: 2.8cm, y: 2.6cm), radius: 1pt)[
#align(center)[
#text(11pt, fill: rgb("6f665a"), tracking: 3pt)[MY CONCEPT NOTEBOOK]
#v(1.6em)
#box(fill: rgb("ffe08a"), inset: (x: 12pt, y: 2pt), outset: (y: 5pt))[#text(font: ("Batang", "Malgun Gothic"), size: 33pt, weight: "bold", fill: rgb("2c2721"))[나만의 개념노트]]
#v(1.8em)
#line(length: 36%, stroke: 1pt + rgb("2f6b4f"))
#v(1.4em)
#text(13pt, fill: rgb("2c2721"))[${subjectsLine}]
#v(0.7em)
#text(11pt, fill: rgb("6f665a"))[초·중·고 개념 ${totalConcepts}개 · ${unitCount}개 영역]
#v(2.6em)
#text(10pt, fill: rgb("6f665a"))[${today} · minomidev-lab.github.io/concept-notes]
]
]
]
]]`);

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
