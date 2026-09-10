# Next.js + TypeScript 일간 ToDo 앱 구축 계획

## Context

빈 저장소(`index.js` + 최소 `package.json`)에서 시작해, **페이지 단위로 하나씩 완성**하며 만드는 개인용 일간 ToDo 앱.
목표: 로그인한 사용자가 날짜별로 자신의 ToDo를 등록/조회/완료/삭제할 수 있는, Vercel에 배포 가능한 앱.

- **Next.js 16 (App Router) + TypeScript**
- **순수 Tailwind CSS v4** (컴포넌트 라이브러리 없음)
- **사용자 관리(인증)** → 개인별로 매일 ToDo 등록
- **Prisma + MongoDB Atlas**
- 추후 **Vercel** 배포

## 확정된 결정

| 항목 | 결정 |
|---|---|
| 인증 방식 | Auth.js(NextAuth) v5 + **Credentials**(이메일/비밀번호, bcryptjs, **JWT 세션**). **Google OAuth 안 씀** → PrismaAdapter·`Account`/`Session` 모델 불필요 |
| ToDo 모델 | **날짜별 일간 목록**. `Todo.date`는 **문자열 `"YYYY-MM-DD"`** 로 저장(옵션 A). "며칠"인지는 **브라우저 로컬 날짜**로 결정 → 타임존 버그 회피, 정확 일치 조회. 미완료 이월 없음 |
| 구현 범위 | 전체 앱, 단 **10단계로 나눠 점진 진행** (각 단계 = 화면/기능 1개 완성 → 확인 → 커밋) |
| 스택 세부 | Next.js **16.3.4** App Router + Tailwind **v4** + **pnpm** (Turbopack). `src/`, alias `@/*` |
| Prisma | **`prisma` / `@prisma/client` 6.19.3** (MongoDB는 Prisma 7/8에서 아직 미지원 → 최신 6.x 사용). `prisma-client-js` 생성기, **커스텀 output 없음** → 기본 위치(node_modules)로 생성. `import { PrismaClient } from "@prisma/client"`. (Next 16 + Turbopack 은 이 조합이 안정적; 커스텀 output 은 파일 트레이싱 경고 발생). `postinstall: prisma generate`, `build: prisma generate && next build` |
| pnpm 빌드 스크립트 | `pnpm-workspace.yaml`의 `allowBuilds` 에서 `@prisma/client`·`@prisma/engines`·`prisma` = `true` (엔진 다운로드·클라이언트 생성 허용) |
| 패키지 매니저 | **pnpm** — `packageManager` 고정, `pnpm-lock.yaml` 커밋, `engines.node >=20` |

## 기술 스택

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`, `globals.css`에서 `@import "tailwindcss"`)
- Auth.js v5 (`next-auth@beta`) — **Credentials Provider + JWT 전략만** (어댑터 없음)
- Prisma ORM 6.19.3 (`prisma` + `@prisma/client`), MongoDB provider, 기본 위치 클라이언트
- **폼 처리**: `react-hook-form` + `@hookform/resolvers` (zod resolver) — 로그인·회원가입·ToDo 입력 폼
- **스키마 검증**: `zod` — 클라이언트 폼 검증과 서버 API 입력 검증에 동일 스키마 재사용 (`src/lib/schemas.ts`)
- `bcryptjs` (비밀번호 해시)
- **패키지 매니저**: `pnpm`
- 배포: Vercel

## 프로젝트 구조 (신규 생성)

```
todo/
├─ prisma/
│  └─ schema.prisma          # User, Todo 모델만
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # 루트 레이아웃, globals.css import, (4단계에서 SessionProvider)
│  │  ├─ globals.css         # @import "tailwindcss"
│  │  ├─ page.tsx            # 진행 로드맵 → (5단계에서) 로그인 시 /today, 아니면 /login
│  │  ├─ health/page.tsx     # [임시] DB 연결 확인용, 9단계에서 삭제
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
│  │  ├─ prisma.ts           # PrismaClient 싱글턴 (globalThis, dev 재실행 대비)
│  │  ├─ auth.ts             # Auth.js 설정 export (auth, handlers, signIn, signOut)
│  │  ├─ schemas.ts          # zod 스키마 (loginSchema, registerSchema, todoSchema) — 폼·API 공용
│  │  └─ date.ts             # todayString() 등 "YYYY-MM-DD" 문자열 유틸 (로컬 날짜 기준)
│  └─ middleware.ts          # 미인증 시 /login 리다이렉트 (matcher: /today, /api/todos)
├─ .env                      # 로컬 (git 무시)
├─ .env.example              # 커밋용 템플릿 (DATABASE_URL, AUTH_SECRET 자리표시자)
├─ tsconfig.json / next.config.ts / postcss.config.mjs / package.json / .gitignore
└─ README.md                 # 설정·실행·배포 방법 (9단계에서 작성)
```

## Prisma 스키마 (핵심)

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
  // output 미지정 → 기본 위치(node_modules). Next 16 + Turbopack 안정 조합.
}

model User {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  email        String   @unique
  nickname     String                    // 화면에 표시되는 닉네임 (회원가입 시 입력)
  passwordHash String                    // bcryptjs 해시
  todos        Todo[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Todo {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  done        Boolean   @default(false)
  completedAt DateTime?                   // [예약] done=true 전환 시 기록 (UI는 나중)
  date        String                      // "YYYY-MM-DD" — 일간 버킷 키 (옵션 A)
  order       Int       @default(0)       // [예약] 같은 날짜 내 수동 정렬 (UI는 나중)
  userId      String    @db.ObjectId
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId, date])
}
```

- `completedAt`, `order`는 **필드만 미리 추가**(스키마 안정화용). 실제 완료시각 기록·드래그 정렬 UI는 이후 단계에서 붙인다.

- MongoDB는 마이그레이션이 없으므로 `pnpm exec prisma db push`로 스키마 반영, `pnpm exec prisma generate`로 클라이언트 생성.
- `date`는 문자열이므로 조회는 `where: { userId, date: "2026-09-10" }` 정확 일치. "오늘"은 클라이언트가 `new Date()`의 로컬 연·월·일로 만든 `"YYYY-MM-DD"`를 서버로 전달(쿼리스트링/바디). `src/lib/date.ts`가 이 포맷 변환/검증을 담당.
- `Account`/`Session` 모델은 없음 (Credentials + JWT 세션). 나중에 OAuth를 붙이면 그때 모델 추가 + `db push`.

## 구현 방식 — 페이지 단위 반복 개발

한 번에 전체를 만들지 않는다. **각 단계는 화면 하나(또는 명확한 기능 하나)를 완성**하고,
직접 브라우저에서 눈으로 확인 → 커밋 → 다음 단계로 넘어간다. 그래서 지금 무엇을 하는지 항상 명확하다.

각 단계 형식: **목표 / 만드는 파일 / 완료 기준(직접 확인) / 커밋 메시지**

---

### 단계 0 — 프로젝트 스캐폴딩 ✅ 완료 (커밋 `f7e4f69`, `master`)

- `pnpm create next-app` 병합 — Next.js **16.3.4**, App Router, TS, Tailwind v4, `src/`, alias `@/*`, Turbopack.
- `package.json`: `name: todo`, `packageManager: pnpm@11.7.0`, `engines.node >=20`. (`only-allow pnpm` 훅은 생략 — `packageManager` + lockfile로 충분)
- `.gitignore`에 `!.env.example` 예외 추가.
- `src/app/page.tsx` = 10단계 로드맵 체크리스트(단계 0만 ✓). `layout.tsx` 메타데이터/`lang="ko"`.
- 확인: `pnpm dev` HTTP 200, `pnpm build` 성공.

### 단계 1 — DB 연결 (Prisma + MongoDB Atlas) ✅ 완료

- `prisma` / `@prisma/client` **6.19.3** 설치 (Prisma 7/8는 MongoDB 미지원 → 6.x 최신). `pnpm-workspace.yaml`의 `allowBuilds`에서 `@prisma/client`·`@prisma/engines`·`prisma` = `true`.
- `prisma/schema.prisma` — `User` + `Todo`, `Todo.date`는 `String`, `completedAt?`·`order` 필드만 예약. 커스텀 `output` 없음.
- `src/lib/prisma.ts` — `globalThis` 싱글턴, `import { PrismaClient } from "@prisma/client"`.
- `.env` (git 무시) 에 `DATABASE_URL` = `mongodb+srv://joohyuna2_db_user:<비번>@cluster0.ozzibnn.mongodb.net/todo?...`. `.env.example` 에 자리표시자 + `AUTH_SECRET` 자리.
- `package.json` 스크립트: `postinstall: prisma generate`, `build: prisma generate && next build`.
- `pnpm exec prisma db push` — Atlas에 `User`·`Todo` 컬렉션 + 인덱스(`User_email_key`, `Todo_userId_date_idx`) 생성 완료.
- `src/app/health/page.tsx` — 서버 컴포넌트, `prisma.user.count()` / `prisma.todo.count()` 출력 (**임시**, 9단계 삭제).
- **확인 완료**: `/health` → "MongoDB Atlas 연결 성공", `users: 0` / `todos: 0`. `pnpm build` 성공 (경고 없음).
- **커밋**: `feat: add Prisma schema and MongoDB connection` (아래에서 진행)

### 단계 2 — 공용 검증 스키마 (zod)

- **목표**: 폼과 API가 같은 규칙을 쓴다.
- **만드는 것**: `src/lib/schemas.ts` — `loginSchema`, `registerSchema`, `todoSchema` + 타입 export.
- **완료 기준**: `pnpm build`/`tsc` 통과. (단독 화면 없음 — 다음 단계에서 소비)
- **커밋**: `feat: add shared zod validation schemas`

### 단계 3 — 회원가입 페이지 `/register`

- **목표**: 새 사용자를 DB에 만든다.
- **만드는 것**: `src/app/register/page.tsx`, `src/components/AuthForm.tsx`(react-hook-form + `zodResolver`), `src/app/api/register/route.ts`(`registerSchema` 검증: 이메일·닉네임·비밀번호 → 이메일 중복 체크 → `bcryptjs` 해시 → `prisma.user.create`).
- **완료 기준**: `/register`에서 잘못된 입력 시 인라인 에러, 정상 입력 시 가입 완료 후 `/login`으로 이동. Prisma Studio에 `email`·`nickname`·해시된 `passwordHash`를 가진 User 문서 생성 확인.
- **커밋**: `feat: registration page and API`

### 단계 4 — 로그인 페이지 `/login` + 세션

- **목표**: 로그인하면 세션이 생긴다.
- **만드는 것**: `next-auth@beta` (어댑터 없음), `src/lib/auth.ts`(Credentials Provider → `passwordHash` bcrypt compare, `session: { strategy: "jwt" }`, `session.user.id` 콜백), `src/app/api/auth/[...nextauth]/route.ts`, `.env`에 `AUTH_SECRET`, `src/app/login/page.tsx`(`AuthForm` 재사용), 루트 레이아웃에 `SessionProvider`.
- **완료 기준**: 가입한 계정으로 로그인 성공 → 홈으로 이동. 헤더에 이메일 + "로그아웃" 버튼이 보이고, 로그아웃이 동작.
- **커밋**: `feat: credentials auth with Auth.js`

### 단계 5 — 라우트 보호 (middleware)

- **목표**: 로그인 안 하면 앱을 못 본다.
- **만드는 것**: `src/middleware.ts`(matcher: `/today`, `/api/todos/:path*`) — 미인증 시 `/login` 리다이렉트. 홈 `page.tsx`는 로그인 시 `/today`로, 아니면 `/login`으로.
- **완료 기준**: 시크릿 창에서 `/today` 접근 시 `/login`으로 튕김. 로그인 후 `/today` 진입.
- **커밋**: `feat: protect routes with middleware`

### 단계 6 — 오늘 ToDo 페이지 `/today` (조회 + 추가)

- **목표**: 오늘 할 일을 적고 목록으로 본다.
- **만드는 것**: `src/lib/date.ts`(`todayString()` / `"YYYY-MM-DD"` 검증), `src/app/api/todos/route.ts`(GET: `where { userId, date }` / POST: `todoSchema` 검증 후 `date` 문자열로 생성), `src/app/today/page.tsx`(서버 컴포넌트 — 클라이언트가 넘긴 `date`(기본=오늘 로컬)로 조회), `src/components/TodoList.tsx`, `src/components/AddTodoForm.tsx`(react-hook-form).
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
- Vercel 프로젝트 환경변수: `DATABASE_URL`, `AUTH_SECRET`(= `pnpm dlx auth secret`), `AUTH_URL`(프로덕션 도메인).
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

## 미해결 질문

- **브랜치 전략**: 현재 `master`에 커밋 중. `main`으로 이름 변경할지 여부 (기본: 그대로 `master` 유지).
- (해결됨) `DATABASE_URL` — 자격증명 채팅으로 수신, DB 이름 `todo`, IP 등록 완료. 단계 1 착수 준비됨.
