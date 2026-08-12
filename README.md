# 📚 나만의 개념노트

초·중·고 과목별 개념을 연결하며 쌓아가는 개인 학습 노트 사이트입니다.

- **사이트**: https://minomidev-lab.github.io/concept-notes/
- **콘텐츠**: 정규 5과목(수학·과학·국어·영어·사회) + KMO 파트, 126개 개념 · 29개 영역. `content/과목/학교급/단원/개념/` 폴더의 마크다운이 곧 콘텐츠이며, 개념마다 `concept.md`(개념 설명)와 `my-note.md`(나의 이해)가 분리되어 있습니다.
- **탐색**: 사이드바 트리, 초→중→고 개념 연결 경로(과목 간 교차 연결 포함), 🔍 즉시 검색, ✏ 노트 작성 진행 표시.
- **편집**: 소유자 전용 편집 모드 — 태블릿에서 마크다운 + 손 스케치를 작성하면 GitHub 커밋으로 저장됩니다 (서버 없음, fine-grained PAT).
- **읽기 환경**: LaTeX 수식(KaTeX), 태블릿 반응형, 라이트/다크 테마("따뜻한 종이 노트" 디자인), giscus 댓글.
- **품질**: main push마다 CI가 단위·e2e 테스트를 통과해야 배포됩니다. 깨진 prev/next 링크·라벨 누락은 빌드가 잡아냅니다.

## 로컬 실행

```bash
npm install
npm run dev
```

빌드·테스트: `npm run build` / `npm run test`(단위) / `npm run e2e`(스모크)

## 책(PDF) 만들기

[Typst](https://typst.app/) 설치(`winget install Typst.Typst`) 후:

```bash
npm run book -- --include-notes                  # 전체 과목 + 나의 이해 포함
npm run book -- --subjects=math,science          # 과목 선택 (개념만)
npm run book -- --out=my-book.pdf                # 출력 파일명 지정
```

결과는 `book/` 폴더에 생성됩니다 (git 추적 안 함).

## 설계 문서

- 스펙: `docs/superpowers/specs/2026-08-07-concept-notes-design.md`
- 1단계 계획: `docs/superpowers/plans/2026-08-08-concept-notes-stage1.md`
