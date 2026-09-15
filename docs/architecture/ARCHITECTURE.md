# ARCHITECTURE.md

현재 시스템 구조 스냅샷. 구조가 바뀔 때마다 이 문서를 갱신한다. (작업 단위 진행 과정은 여기 넣지 않는다 — 그건 RFC/PLAN.md 몫)

## 스택

- Next.js **16.3.4** (App Router, Turbopack), React **19.2.8**, TypeScript
- Tailwind CSS **v4** (`@tailwindcss/postcss`, `globals.css`에서 `@import "tailwindcss"` + `@theme inline` 브랜드 토큰)
- Auth.js v5 (`next-auth@5.0.0-beta.32`) — **Credentials Provider + JWT 세션만** (어댑터 없음, OAuth 없음)
- Prisma **6.19.3** (`prisma` + `@prisma/client`), MongoDB Atlas, 클라이언트 기본 위치 생성(커스텀 `output` 없음) — 이유는 ADR-0003
- `react-hook-form` + `@hookform/resolvers`(zod resolver), `zod` **4.5.4** — 폼·API 공용 검증 스키마
- `bcryptjs` — 비밀번호 해시
- 패키지 매니저 **pnpm** (`packageManager` 고정, `engines.node >=20`)
- 배포: Vercel

## 폴더 구조 (현재)

```
todo/
├─ prisma/
│  └─ schema.prisma              # User, Todo 모델
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # 루트 레이아웃, Providers/Header 장착
│  │  ├─ globals.css             # 브랜드 컬러 토큰(@theme inline)
│  │  ├─ page.tsx                # auth() 후 /today 또는 /login 리다이렉트
│  │  ├─ login/page.tsx          # 로그인 화면
│  │  ├─ register/page.tsx       # 회원가입 화면
│  │  ├─ today/
│  │  │  ├─ page.tsx             # 메인 화면 (?date=YYYY-MM-DD)
│  │  │  └─ loading.tsx          # RSC 로딩 UI
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts   # Auth.js 핸들러
│  │     ├─ register/route.ts             # 회원가입 (POST)
│  │     └─ todos/
│  │        ├─ route.ts                   # GET(날짜별 목록), POST(생성)
│  │        ├─ [id]/route.ts              # PATCH(완료토글/수정), DELETE
│  │        └─ summary/route.ts           # GET ?month=YYYY-MM (캘린더 dot용 날짜 목록)
│  ├─ components/
│  │  ├─ Header.tsx              # 세션 상태별 네비/버튼
│  │  ├─ AuthForm.tsx            # 로그인/회원가입 공용 폼
│  │  ├─ AddTodoForm.tsx         # 할 일 추가 폼
│  │  ├─ TodoList.tsx            # 목록 + useOptimistic 낙관적 업데이트
│  │  ├─ TodoItem.tsx            # 체크박스 + 완료시각 + 삭제
│  │  ├─ TodoStats.tsx           # "완료 N / 전체 M"
│  │  ├─ DateNav.tsx             # 주간 스트립 / 월간 캘린더 토글 + 이동
│  │  ├─ TodayRedirect.tsx       # ?date 없을 때 로컬 오늘로 리다이렉트
│  │  └─ Providers.tsx           # SessionProvider 래퍼
│  ├─ lib/
│  │  ├─ prisma.ts               # PrismaClient 싱글턴 (globalThis)
│  │  ├─ auth.ts                 # Auth.js 풀 설정 (Credentials authorize, jwt/session 콜백)
│  │  ├─ auth.config.ts          # Edge-safe 최소 설정 (proxy.ts 전용, prisma/bcrypt import 없음)
│  │  ├─ schemas.ts              # zod 스키마 (login/register/todo) — 폼·API 공용
│  │  └─ date.ts                 # "YYYY-MM-DD" 문자열 유틸(순수 함수, Intl 미사용)
│  ├─ types/next-auth.d.ts       # Session.user.id / JWT.id 타입 확장
│  └─ proxy.ts                   # 인증 라우트 가드 (구 middleware.ts, Next 16 이름)
├─ design/                       # 로컬 전용 목업·검토 노트 (git 무시)
├─ docs/                         # PRD / ARCHITECTURE / ADR / RFC (이 문서 구조)
└─ PLAN.md                       # 단계별 구현 이력 아카이브(이 구조 도입 이전 기록)
```

`src/components/MonthCalendar.tsx`는 더 이상 존재하지 않는다 — 인라인 토글 방식으로 대체되며 삭제됨 (ADR-0004).

## 데이터 모델 (`prisma/schema.prisma`)

```prisma
model User {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  email        String   @unique
  nickname     String
  passwordHash String
  todos        Todo[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Todo {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  done        Boolean   @default(false)
  completedAt DateTime?               // done=true 전환 시 기록, 완료 시각 표시에 사용
  date        String                  // "YYYY-MM-DD" — 브라우저 로컬 날짜 기준 (ADR-0002)
  order       Int       @default(0)   // 예약: 수동 정렬 UI는 아직 없음
  userId      String    @db.ObjectId
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId, date])
}
```

- `Account`/`Session` 모델 없음 — Credentials + JWT 세션이라 어댑터 불필요 (ADR-0001).
- MongoDB는 마이그레이션이 없으므로 스키마 변경 시 `pnpm exec prisma db push` + `pnpm exec prisma generate`.

## 인증/인가 흐름

1. `src/lib/auth.config.ts` — Edge에서 도는 최소 설정. `authorized` 콜백이 `/today*` 접근을 막는다. Prisma/bcrypt import 없음(Edge 런타임 제약).
2. `src/lib/auth.ts` — `auth.config.ts`를 스프레드하고 Credentials Provider(`authorize`: zod 검증 → 이메일 소문자 정규화 → `bcrypt.compare`)와 `jwt`/`session` 콜백(`session.user.id` 노출)을 추가한 풀 설정.
3. `src/proxy.ts` — `NextAuth(authConfig).auth`를 default export, `matcher: ["/today", "/today/:path*"]`. **페이지만** 보호한다.
4. `/api/todos/*` 라우트는 미들웨어 대상이 아니므로, 각 핸들러 내부에서 `auth()`를 호출해 401을 직접 반환한다(리다이렉트 방지).
5. `[id]` 라우트는 `findFirst({ id, userId })`로 소유권까지 확인 — 세션은 있지만 남의 데이터인 경우 404(403 아님, 존재 자체를 숨김).

## 날짜 모델

- `Todo.date`는 `"YYYY-MM-DD"` 문자열. "오늘"은 **브라우저의 로컬 연/월/일**로 클라이언트가 계산해 서버로 전달한다(쿼리스트링/바디) — 서버(UTC) 기준 계산은 쓰지 않는다.
- `src/lib/date.ts`가 모든 날짜 관련 순수 함수를 담당: `toDateString`/`todayString`(로컬→문자열), `isDateString`(형식+실재 검증), `addDays`, `formatTime`(오전/오후 h:mm), `getWeekDates`/`isMonthString`/`toMonthString`/`addMonths`/`getMonthRange`/`getMonthMatrix`(캘린더용). 전부 `Intl` 미사용 — 로케일 데이터 환경 의존을 피하기 위해 순수 산술로 구현.

## UI 구조 (today 화면)

- `today/page.tsx`가 서버에서 `auth()` + 날짜별 목록을 조회하고, `<DateNav>` + 흰 바텀시트 카드(`<AddTodoForm>` + `<TodoList>` + `<TodoStats>`)를 렌더.
- `<DateNav>` 최상단에 "주간보기 / 월간보기" 토글이 항상 하나만 렌더된다(두 헤더 동시 노출 금지). 주간모드는 7일 스트립, 월간모드는 6×7 그리드(`getMonthMatrix`) + `/api/todos/summary`로 받은 "할 일 있는 날짜" 목록을 점 배지로 표시.
- 브랜드 컬러 토큰(`globals.css`): `--color-brand-50/100/500/700/900`(그린 계열, `900`은 실제로는 중간 톤 `#47a771`), `--color-accent-orange`/`--color-accent-orange-bright`(할 일 표시 전용). 배경은 단색 `brand-50`.

## Vercel 배포

- Vercel이 `pnpm-lock.yaml` + `packageManager`로 pnpm을 자동 감지.
- `build` 스크립트가 `prisma generate && next build`라서 빌드 캐시로 인한 client 누락이 없음. `postinstall`에도 동일하게 있음.
- 필요 환경변수: `DATABASE_URL`, `AUTH_SECRET`(`pnpm dlx auth secret`), `AUTH_URL`은 보통 Vercel이 자동 감지해 생략 가능.
- MongoDB Atlas Network Access에 `0.0.0.0/0` 허용 필요(서버리스라 IP 고정 불가).

## 참고

- 각 결정의 배경(왜 이렇게 했는가)은 `docs/adr/` 참고.
- 단계별로 무엇을, 어떻게 검증했는지의 상세 이력(curl 결과, 커밋 해시 등)은 `PLAN.md`에 아카이브되어 있음.
