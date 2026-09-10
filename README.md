# 일간 ToDo

로그인한 사용자가 **날짜별로** 자신의 할 일을 등록·완료·삭제하는 개인 ToDo 앱.

## 스택

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 (순수 유틸리티)
- Prisma 6 + MongoDB (Atlas)
- Auth.js v5 (Credentials + JWT 세션)
- react-hook-form + zod (폼·API 공용 검증)
- 패키지 매니저: **pnpm**

## 로컬 실행

```bash
# 1. 의존성 설치 (postinstall 에서 prisma generate 자동 실행)
pnpm install

# 2. 환경변수
cp .env.example .env
#   - DATABASE_URL : MongoDB Atlas 연결 문자열 (DB 이름 포함, 예: .../todo?...)
#   - AUTH_SECRET  : pnpm dlx auth secret  로 생성한 값
#   Atlas > Network Access 에 현재 IP(또는 0.0.0.0/0) 허용 필요

# 3. 스키마를 DB에 반영 (MongoDB는 마이그레이션 없음)
pnpm exec prisma db push

# 4. 개발 서버
pnpm dev
```

→ http://localhost:3000

| 경로 | 설명 | 접근 |
|---|---|---|
| `/` | 로그인 시 `/today`, 아니면 `/login` 로 리다이렉트 | 공개 |
| `/register` | 회원가입 (이메일 · 닉네임 · 비밀번호 6자 이상) | 공개 |
| `/login` | 로그인 | 공개 |
| `/today` | 오늘 할 일. `?date=YYYY-MM-DD` 로 다른 날짜 | 로그인 필요 |

## 데이터 모델 (`prisma/schema.prisma`)

- `User` — `email`(unique) · `nickname` · `passwordHash`(bcrypt)
- `Todo` — `title` · `done` · `completedAt?` · `date`("YYYY-MM-DD" 문자열) · `order` · `userId`
  - `date`는 **브라우저 로컬 날짜** 기준 문자열. 타임존 이슈를 피하려는 선택.

## 스크립트

| 명령 | 하는 일 |
|---|---|
| `pnpm dev` | 개발 서버 (Turbopack) |
| `pnpm build` | `prisma generate && next build` |
| `pnpm start` | 프로덕션 서버 |
| `pnpm lint` | ESLint |
| `pnpm exec prisma studio` | DB 브라우저 |
| `pnpm exec prisma db push` | 스키마를 DB에 반영 |

## Vercel 배포

1. 이 저장소를 GitHub에 푸시 (완료됨: `github.com/joohyuna/todo`).
2. [vercel.com/new](https://vercel.com/new) 에서 저장소 import. 프레임워크는 Next.js 자동 감지, 패키지 매니저는 `pnpm-lock.yaml`로 pnpm 자동 선택.
3. **Environment Variables** 등록:
   - `DATABASE_URL` — Atlas 연결 문자열 (프로덕션용 DB 이름 사용 권장, 예: `/todo`)
   - `AUTH_SECRET` — `pnpm dlx auth secret` 값
   - (`AUTH_URL` 은 Vercel이 자동 감지하므로 보통 생략)
4. **MongoDB Atlas → Network Access** 에 `0.0.0.0/0` 허용 (Vercel 서버리스 IP 고정 불가).
5. Deploy. 이후 `master` 에 푸시하면 자동 재배포.

`build` 스크립트가 `prisma generate` 를 포함하므로 Vercel 빌드 캐시로 인한 client 누락이 없습니다.
