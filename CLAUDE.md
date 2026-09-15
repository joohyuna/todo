# CLAUDE.md

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 따라야 하는 규칙과 문서 구조를 정의합니다.

---

## 1. 프로젝트 개요

로그인한 사용자가 **날짜별로** 자신의 할 일을 등록·조회·완료·삭제하는 개인용 일간 ToDo 웹앱. 페이지 단위로 하나씩 완성해가는 방식으로 처음부터 구축했고, 핵심 흐름(인증·CRUD·날짜 네비게이션)은 완료되어 Vercel에 배포 가능한 상태다. 현재는 디자인 개편(브랜드 컬러, 주간/월간 캘린더)까지 반영된 상태이며, 카테고리·우선순위 등은 확장 후보로 남아 있다.

- **목적**: 개인이 하루 단위로 할 일을 관리하는 심플한 ToDo 서비스. 사용자별 데이터 격리, 날짜별 조회가 핵심.
- **기술 스택**: Next.js 16(App Router, Turbopack) + React 19 + TypeScript, Tailwind CSS v4, Prisma 6.19.3 + MongoDB Atlas, Auth.js v5(Credentials + JWT 세션), react-hook-form + zod(폼·API 공용 검증), pnpm, Vercel 배포.
- **주요 진입점**: `src/app/layout.tsx`(루트 레이아웃), `src/app/today/page.tsx`(메인 화면), `src/proxy.ts`(인증 라우트 가드, 구 `middleware.ts`), `src/lib/auth.ts` / `src/lib/prisma.ts`(핵심 설정 싱글턴).

---

## 2. 문서 구조 (Documentation Structure)

작업 성격에 따라 아래 위치에 문서를 만들고 참조합니다.

```
docs/
├── prd/            # 제품 요구사항 (Why / What) — 기능 작업 전 확인
├── architecture/
│   └── ARCHITECTURE.md   # 현재 시스템 구조 스냅샷 — 최신 상태 유지
├── adr/            # 개별 기술 결정 기록 (append-only)
└── rfcs/           # 기능별 구현 계획 (Plan 모드 산출물)
```

| 문서 | 질문 | 갱신 빈도 |
|---|---|---|
| PRD | 무엇을/왜 만드는가 (제품 관점) | 기능 시작 시 1회 |
| ARCHITECTURE.md | 전체 구조가 지금 어떤가 | 구조 변경 시마다 |
| ADR | 이 결정을 왜 이렇게 내렸나 | append-only, 결정마다 새 파일 |
| RFC/Plan | 이번 작업을 어떻게 구현하나 | 작업 단위마다 |

---

## 3. 워크플로우 (신규 기능 작업 시)

1. `docs/prd/`에 관련 PRD가 있는지 먼저 확인한다. 없으면 요구사항을 먼저 명확히 한다.
2. Plan 모드로 기술 접근 방식을 논의하고, 결과를 `docs/rfcs/<기능명>.md`로 정리한다.
    - RFC에는 목표, 범위(Scope/Non-scope), 접근 방식, 체크박스 작업 단계, 변경 파일 목록, 리스크, 검증 방법을 포함한다.
3. RFC 안에서 중요한 기술적 갈림길(A vs B 선택 등)이 있으면 `docs/adr/000X-제목.md`로 별도 분리한다.
    - ADR 포맷: Status / Context / Decision / Consequences
    - 결정이 바뀌면 새 ADR을 만들고 이전 ADR의 Status를 `Superseded by ADR-00XX`로 변경한다. 기존 ADR은 수정하지 않는다.
4. 작업이 전체 구조에 영향을 준다면 `docs/architecture/ARCHITECTURE.md`를 갱신한다.
5. 작업 완료 후 관련 GitHub Issue 상태를 갱신한다 (아래 4번 참고).

---

## 4. GitHub Issue 워크플로우

- 작업 시작 전: `gh issue list`로 관련 이슈가 이미 있는지 확인한다.
- RFC 완료 후: 작업을 단위별로 쪼개서 `gh issue create`로 등록한다.
- 커밋/PR에는 관련 이슈를 `Closes #N` 형식으로 연결한다.
- 라벨 규칙: `bug` / `feature` / `refactor` / `chore` 중 최소 하나를 지정한다.

---

## 5. 코드 스타일 / 컨벤션

- 커밋 메시지 규칙: Conventional Commits 스타일(`feat:`, `fix:`, `chore:`, `docs:`, `change:`)을 실제로 사용 중. 제목은 한 줄로 변경 내용을 간결히 요약.
- 브랜치 전략: 개인 프로젝트라 현재는 `master`에 직접 커밋(PR 없음). 규모가 커지면 `feature/`, `fix/` 프리픽스 도입을 검토한다.
- 테스트: 별도 자동화 테스트 스위트는 없음. 각 기능은 `curl`로 API 동작(정상/에러/권한 케이스) 확인 + 브라우저에서 직접 눈으로 확인. 변경마다 `tsc --noEmit`과 `pnpm build` 통과가 필수 완료 기준. **커밋을 하기 전에 테스트는 필수적으로 진행해야 한다.**
- 린트/포맷: 커밋 전 `pnpm lint`(ESLint) 통과 권장. 별도 포맷터 없음, Tailwind 유틸리티 클래스는 마크업에 직접 작성.
- 데이터 검증: 클라이언트 폼(react-hook-form)과 서버 API가 `src/lib/schemas.ts`의 동일 zod 스키마를 공유한다. 새 입력 필드가 생기면 스키마를 먼저 갱신한다.

---

## 6. 하지 말아야 할 것 (Guardrails)

- 오버 엔지니어링은 하지마.
- `docs/adr/`에 있는 파일은 직접 수정하지 않는다 (append-only). 결정이 바뀌면 새 ADR을 만들고 이전 ADR의 Status를 `Superseded`로 변경한다.
- 사람 확인 없이 `master`에 직접 push하지 않는다. (현재 개인 저장소라 직접 커밋 자체는 하되, force-push·reset 등 되돌리기 어려운 작업은 항상 먼저 확인받는다.)
- `.env`의 실제 값(`DATABASE_URL`, `AUTH_SECRET`)이나 그 외 시크릿이 포함된 파일은 커밋하지 않는다. 템플릿은 `.env.example`에만 자리표시자로 남긴다.
- `Todo.date`를 `DateTime` 타입으로 바꾸거나 서버(UTC) 기준 날짜 계산으로 되돌리지 않는다 — 브라우저 로컬 날짜 문자열(`"YYYY-MM-DD"`) 방식은 타임존 버그를 피하기 위한 의도된 설계다 (`docs/adr/0002-todo-date-as-local-string.md`).
- `prisma` / `@prisma/client`를 7.x 이상으로 올리지 않는다 — 이 버전대는 아직 MongoDB provider를 지원하지 않는다 (`docs/adr/0003-prisma-6x-pin.md`).
- `design/notes.md`(git 무시, 로컬 전용)를 최종 디자인 값의 출처로 삼지 않는다 — 검토 당시 초안이라 실제 채택 값과 다를 수 있다. 최종 상태는 `docs/architecture/ARCHITECTURE.md`와 코드 기준으로 확인한다.
- 스코프 밖(RFC의 Non-scope에 명시된) 작업은 별도 이슈로 분리하고, 현재 작업에 포함하지 않는다.

---

## 7. 참고 링크

- 제품 요구사항: `docs/prd/todo-app.md`
- 아키텍처 현황: `docs/architecture/ARCHITECTURE.md`
- 진행 중인 ADR 목록: `docs/adr/`
- 과거 구현 이력(단계별 상세 로그, 커밋 해시 포함): `PLAN.md` — 이 문서 구조 도입 이전의 작업 기록. 새 작업은 위 구조(PRD/ARCHITECTURE/ADR/RFC)를 따르고, `PLAN.md`는 참고용 아카이브로 유지한다.
- 이슈 트래커: github.com/joohyuna/todo (Issues)

---

## 8. 기기 전환 시 — "메모리 저장해줘"

사용자가 여러 기기(예: 집 PC / 회사 PC)를 오가며 작업한다. Claude의 로컬 memory(대화 중 자동으로 쌓이는 개인화 기억)는 **기기 간 동기화되지 않으므로**, 다른 기기로 넘어가기 전에 사용자가 "메모리 저장해줘"라고 말하면 아래를 수행한다.

1. 현재 세션 동안 로컬 memory에 쌓인 내용 중, 이 프로젝트에 계속 적용될 항목(워크플로우 규칙·기술 결정·스코프 변경 등)을 골라낸다.
2. 성격에 맞는 git 추적 파일로 옮겨 적는다: 규칙/가드레일 → 이 파일, 기술 결정 → `docs/adr/`, 제품 스코프 → `docs/prd/`, 구조 변경 → `docs/architecture/ARCHITECTURE.md`.
3. `pnpm exec tsc --noEmit` / `pnpm build`로 확인 후 커밋·푸시한다 (5번 참고).
4. 이제 git 파일에 반영된 로컬 memory 항목은 **삭제**한다 — 같은 내용을 두 곳에 복제해서 남겨두지 않는다(git 파일이 유일한 출처).
