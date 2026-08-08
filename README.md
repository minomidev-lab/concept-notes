# 📚 나만의 개념노트

초·중·고 과목별 개념을 연결하며 쌓아가는 개인 학습 노트 사이트입니다.

- **사이트**: https://minomidev-lab.github.io/concept-notes/
- **구조**: `content/과목/학교급/단원/개념/` 폴더의 마크다운이 곧 콘텐츠입니다. 개념마다 `concept.md`(개념 설명)와 `my-note.md`(나의 이해)가 분리되어 있습니다.
- **특징**: 초→중→고 개념 연결 경로, LaTeX 수식(KaTeX), 태블릿 반응형, 소유자 편집 모드(마크다운 + 손 스케치, GitHub 커밋으로 저장).

## 로컬 실행

```bash
npm install
npm run dev
```

빌드·테스트: `npm run build` / `npm run test`(단위) / `npm run e2e`(스모크)

## 설계 문서

- 스펙: `docs/superpowers/specs/2026-08-07-concept-notes-design.md`
- 1단계 계획: `docs/superpowers/plans/2026-08-08-concept-notes-stage1.md`
