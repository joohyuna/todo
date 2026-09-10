# Next.js + TypeScript 일간 ToDo 앱 구축 계획

## Context

현재 저장소는 그린필드 상태다 (`index.js` 한 줄 + 최소 `package.json`, 커밋 없음, `master` 브랜치).
사용자는 다음을 원한다:

- **Next.js + TypeScript** 기반 ToDo 앱
- **순수 Tailwind CSS**로 스타일링 (컴포넌트 라이브러리 없음)
- **사용자 관리(인증)** → 개인별로 매일 ToDo 등록
- **Prisma + MongoDB** (MongoDB Atlas에 DB 이미 존재)
- 추후 **Vercel** 배포

목표: 로그인한 사용자가 날짜별로 자신의 ToDo를 등록/조회/완료/삭제할 수 있는, Vercel에 바로 올릴 수 있는 앱.

## 확정 필요 사항 (아래는 현재 가정값 — 사용자 확인 후 조정)

| 항목 | 가정값 | 대안 |
|---|---|---|
| 인증 방식 | Auth.js(NextAuth) v5 + **Credentials**(이메일/비밀번호, bcrypt, JWT 세션) | Google OAuth / 둘 다 / 인증 없음 |
| ToDo 모델 | **날짜별 일간 목록** (`date` 필드 + 어제/오늘/내일 네비게이션) | 미완료 자동 이월 / 마감일 기반 단일 목록 |
| 구현 범위 | **전체 앱** (스캐폴딩→인증→CRUD→날짜 뷰→배포 설정) | MVP 먼저 |
| 스택 세부 | Next.js 15 **App Router** + Tailwind **v4** + **pnpm** | Pages Router / Tailwind v3 |
| 패키지 매니저 | **pnpm** (모든 스크립트·CI·Vercel 빌드에서 pnpm 사용) | npm / yarn |

## 기술 스택

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`, `globals.css`에서 `@import "tailwindcss"`)
- Auth.js v5 (`next-auth@beta`) — Credentials Provider, Prisma Adapter, JWT 전략
- Prisma ORM + `@prisma/client`, MongoDB provider
- **폼 처리**: `react-hook-form` + `@hookform/resolvers` (zod resolver) — 로그인·회원가입·ToDo 입력 폼
- **스키마 검증**: `zod` — 클라이언트 폼 검증과 서버 API 입력 검증에 동일한 스키마 재사용 (`src/lib/schemas.ts`에 정의)
- `bcryptjs` (비밀번호 해시)
- **패키지 매니저**: `pnpm` (`packageManager` 필드 고정, `pnpm-lock.yaml` 커밋)
- 배포: Vercel

## 프로젝트 구조 (신규 생성)

```
todo/
├─ prisma/
│  └─ schema.prisma          # User, Account, Session, Todo 모델
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # 루트 레이아웃, globals.css import, SessionProvider
│  │  ├─ globals.css         # @import "tailwindcss"
│  │  ├─ page.tsx            # → /today 로 리다이렉트 (로그인 시) 또는 /login
│  │  ├─ login/page.tsx      # 로그인 폼
│  │  ├─ register/page.tsx   # 회원가입 폼
│  │  ├─ today/page.tsx      # 날짜별 ToDo 메인 화면 (?date=YYYY-MM-DD)
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts   # Auth.js 핸들러
│  │     ├─ register/route.ts             # 회원가입 (POST)
│  │     └─ todos/
│  │        ├─ route.ts                   # GET(목록, date 쿼리), POST(생성)
│  │        └─ [id]/route.ts              # PATCH(완료토글/수정), DELETE
│  ├─ components/
│  │  ├─ TodoList.tsx        # 클라이언트, 낙관적 업데이트
│  │  ├─ TodoItem.tsx        # 체크박스 + 삭제
│  │  ├─ AddTodoForm.tsx     # 입력 폼
│  │  ├─ DateNav.tsx         # 이전/오늘/다음 날짜 이동
│  │  └─ AuthForm.tsx        # 로그인/회원가입 공용 폼
│  ├─ lib/
│  │  ├─ prisma.ts           # PrismaClient 싱글턴 (dev HMR 대비)
│  │  ├─ auth.ts             # Auth.js 설정 export (auth, handlers, signIn, signOut)
│  │  ├─ schemas.ts          # zod 스키마 (loginSchema, registerSchema, todoSchema) — 폼·API 공용
│  │  └─ date.ts             # 날짜 정규화 유틸 (KST 자정 기준 등)
│  └─ middleware.ts          # 미인증 시 /login 리다이렉트 (matcher: /today, /api/todos)
├─ .env                      # 로컬 (git 무시)
├─ .env.example              # 커밋용 템플릿
├─ tsconfig.json / next.config.ts / postcss.config.mjs / package.json / .gitignore
└─ README.md                 # 설정·실행·배포 방법
```

## Prisma 스키마 (핵심)

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}

model User {
  id       String  @id @default(auto()) @map("_id") @db.ObjectId
  email    String  @unique
  name     String?
  password String            // Credentials 해시 (bcrypt)
  todos    Todo[]
  accounts Account[]
  sessions Session[]
  createdAt DateTime @default(now())
}

model Todo {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  done      Boolean  @default(false)
  date      DateTime            // 해당 날짜 자정(UTC 정규화) — 일간 버킷 키
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId, date])
}

// Auth.js 표준 Account / Session 모델 (OAuth/DB세션 대비, 스키마에 포함)
```

- MongoDB는 마이그레이션이 없으므로 `pnpm dlx prisma db push`로 스키마 반영, `pnpm dlx prisma generate`로 클라이언트 생성.
- `date`는 `lib/date.ts`에서 "YYYY-MM-DD → 그 날 00:00 UTC"로 정규화해 하루 단위 조회를 정확히 한다. (타임존 처리 방식은 구현 시 확정)

## 구현 방식 — 페이지 단위 반복 개발

한 번에 전체를 만들지 않는다. **각 단계는 화면 하나(또는 명확한 기능 하나)를 완성**하고,
직접 브라우저에서 눈으로 확인 → 커밋 → 다음 단계로 넘어간다. 그래서 지금 무엇을 하는지 항상 명확하다.

각 단계 형식: **목표 / 만드는 파일 / 완료 기준(직접 확인) / 커밋 메시지**

---

### 단계 0 — 프로젝트 스캐폴딩 (실행되는 빈 앱)

- **목표**: `pnpm dev`로 뜨는 Next.js 앱 + Tailwind 동작 확인.
- **만드는 것**: `index.js` 제거, `pnpm create next-app`(App Router·TS·Tailwind v4·`src/`·alias `@/*`) 결과 병합, `package.json`에 `packageManager: pnpm@<버전>`, `.npmrc`(`only-allow pnpm`), `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`(임시 랜딩), `globals.css`.
- **완료 기준**: `http://localhost:3000`에서 Tailwind 스타일이 적용된 랜딩 페이지가 보인다. `pnpm build` 성공.
- **커밋**: `chore: scaffold Next.js + TypeScript + Tailwind (pnpm)`

### 단계 1 — DB 연결 (Prisma + MongoDB Atlas)

- **목표**: 앱이 Atlas DB에 실제로 붙는다.
- **만드는 것**: `prisma/schema.prisma`(User·Todo·Account·Session), `src/lib/prisma.ts` 싱글턴, `.env`+`.env.example`에 `DATABASE_URL`, `postinstall`/`build` 스크립트에 `prisma generate`, `pnpm dlx prisma db push`.
- **완료 기준**: `pnpm dlx prisma studio`에서 컬렉션이 보인다. 임시 `src/app/health/page.tsx`(서버 컴포넌트)에서 `prisma.user.count()` 결과를 화면에 출력해 연결 성공을 눈으로 확인.
- **커밋**: `feat: add Prisma schema and MongoDB connection`

### 단계 2 — 공용 검증 스키마 (zod)

- **목표**: 폼과 API가 같은 규칙을 쓴다.
- **만드는 것**: `src/lib/schemas.ts` — `loginSchema`, `registerSchema`, `todoSchema` + 타입 export.
- **완료 기준**: `pnpm build`/`tsc` 통과. (단독 화면 없음 — 다음 단계에서 소비)
- **커밋**: `feat: add shared zod validation schemas`

### 단계 3 — 회원가입 페이지 `/register`

- **목표**: 새 사용자를 DB에 만든다.
- **만드는 것**: `src/app/register/page.tsx`, `src/components/AuthForm.tsx`(react-hook-form + `zodResolver`), `src/app/api/register/route.ts`(`registerSchema` 검증 → 이메일 중복 체크 → `bcryptjs` 해시 → `prisma.user.create`).
- **완료 기준**: `/register`에서 잘못된 입력 시 인라인 에러, 정상 입력 시 가입 완료 후 `/login`으로 이동. Prisma Studio에 해시된 password를 가진 User 문서 생성 확인.
- **커밋**: `feat: registration page and API`

### 단계 4 — 로그인 페이지 `/login` + 세션

- **목표**: 로그인하면 세션이 생긴다.
- **만드는 것**: `next-auth@beta` + `@auth/prisma-adapter`, `src/lib/auth.ts`(Credentials Provider → bcrypt compare, JWT 전략, `session.user.id` 콜백), `src/app/api/auth/[...nextauth]/route.ts`, `src/app/login/page.tsx`(`AuthForm` 재사용), 루트 레이아웃에 `SessionProvider`.
- **완료 기준**: 가입한 계정으로 로그인 성공 → 홈으로 이동. 헤더에 이메일 + "로그아웃" 버튼이 보이고, 로그아웃이 동작.
- **커밋**: `feat: credentials auth with Auth.js`

### 단계 5 — 라우트 보호 (middleware)

- **목표**: 로그인 안 하면 앱을 못 본다.
- **만드는 것**: `src/middleware.ts`(matcher: `/today`, `/api/todos/:path*`) — 미인증 시 `/login` 리다이렉트. 홈 `page.tsx`는 로그인 시 `/today`로, 아니면 `/login`으로.
- **완료 기준**: 시크릿 창에서 `/today` 접근 시 `/login`으로 튕김. 로그인 후 `/today` 진입.
- **커밋**: `feat: protect routes with middleware`

### 단계 6 — 오늘 ToDo 페이지 `/today` (조회 + 추가)

- **목표**: 오늘 할 일을 적고 목록으로 본다.
- **만드는 것**: `src/lib/date.ts`(날짜 정규화), `src/app/api/todos/route.ts`(GET: 본인+오늘 / POST: `todoSchema` 검증 후 생성), `src/app/today/page.tsx`(서버 컴포넌트, 오늘 todos 조회), `src/components/TodoList.tsx`, `src/components/AddTodoForm.tsx`(react-hook-form).
- **완료 기준**: `/today`에서 할 일을 추가하면 목록에 즉시 나타나고, 새로고침 후에도 유지된다.
- **커밋**: `feat: today todo list with create`

### 단계 7 — ToDo 완료 토글 / 삭제

- **목표**: 항목을 체크하고 지운다.
- **만드는 것**: `src/app/api/todos/[id]/route.ts`(PATCH: done/title, DELETE — 둘 다 소유권 확인), `src/components/TodoItem.tsx`(체크박스 + 삭제 버튼, `useOptimistic`으로 즉시 반영).
- **완료 기준**: 체크 시 취소선/완료 스타일, 삭제 시 목록에서 사라짐. 새로고침 후 상태 유지. 다른 계정으로 로그인하면 남의 항목이 안 보임.
- **커밋**: `feat: toggle and delete todos`

### 단계 8 — 날짜 네비게이션 (일간 뷰 완성)

- **목표**: 어제/오늘/내일 등 날짜별로 목록을 넘겨본다.
- **만드는 것**: `src/components/DateNav.tsx`(이전/오늘/다음 + 날짜 표시), `/today?date=YYYY-MM-DD` 쿼리 처리(page.tsx·API GET에 `date` 반영).
- **완료 기준**: 날짜를 이동하면 그 날짜의 목록만 보이고, 날짜별로 항목이 분리되어 저장된다.
- **커밋**: `feat: date navigation for daily lists`

### 단계 9 — 마무리 & 배포 준비

- **목표**: 남에게 넘길 수 있는 상태.
- **만드는 것**: 임시 `/health` 페이지 제거, `README.md`(로컬 실행: `pnpm install` → `pnpm dlx prisma db push` → `pnpm dev` / 배포 절차), `.env.example` 최종화, 반응형·빈 상태·로딩 UI 정리.
- **완료 기준**: `pnpm build` 성공. README만 보고 처음부터 앱을 띄울 수 있다. Vercel 배포 후 아래 "검증 방법" 전체 통과.
- **커밋**: `docs: README and deployment setup` + Vercel 배포

## Vercel 배포 설정

- 패키지 매니저: Vercel이 `pnpm-lock.yaml` + `packageManager` 필드를 감지해 자동으로 pnpm 사용.
- `package.json` `build` 스크립트: `prisma generate && next build` (Vercel 빌드 캐시로 client 누락 방지). `postinstall`에도 `prisma generate`.
- Vercel 프로젝트 환경변수: `DATABASE_URL`, `AUTH_SECRET`(= `pnpm dlx auth secret`), `AUTH_URL`(프로덕션 도메인). OAuth 추가 시 `AUTH_GOOGLE_ID/SECRET`.
- MongoDB Atlas Network Access에 `0.0.0.0/0` 허용(또는 Vercel IP) 필요.
- README에 배포 절차 문서화.

## 검증 방법 (단계 9 이후 전체 회귀 점검)

각 단계는 위의 "완료 기준"으로 그때그때 확인한다. 아래는 마지막에 처음부터 끝까지 한 번 훑는 시나리오다.

1. `pnpm dev` → `http://localhost:3000`.
2. `/register`로 계정 생성 → 잘못된 입력 시 react-hook-form 인라인 에러 표시, 정상 시 DB에 User 문서 + 해시된 password 확인 (`pnpm dlx prisma studio`).
3. `/login` → 성공 시 `/today` 접근, 미로그인 시 `/login` 리다이렉트(middleware) 확인.
4. 오늘 날짜에 ToDo 추가/완료토글/삭제 → 새로고침 후 유지 확인.
5. `DateNav`로 어제/내일 이동 시 목록이 날짜별로 분리되는지 확인.
6. 다른 계정으로 로그인 시 남의 ToDo가 안 보이는지(소유권 격리) 확인.
7. `pnpm build` 로컬 성공 → Vercel 배포 후 동일 시나리오 재확인.

## 미해결 질문 (구현 착수 전 사용자 확인)

- 인증 방식 (Credentials / Google OAuth / 둘 다 / 없음)
- ToDo 모델 (날짜별 / 미완료 이월 / 마감일 기반)
- 구현 범위 (전체 / MVP)
- 스택 세부 (App Router vs Pages Router, Tailwind v4 vs v3)
- 커밋/브랜치 전략 (`master` → `main` 전환 여부, 첫 커밋 시점)
