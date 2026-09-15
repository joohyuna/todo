# ADR-0001: Credentials 인증 + JWT 세션 (OAuth 미사용)

- **Status**: Accepted

## Context

개인용 ToDo 앱에 로그인 기능이 필요했다. Auth.js(NextAuth) v5 도입을 검토하면서, Google 등 OAuth Provider를 붙일지, 이메일/비밀번호(Credentials)만 지원할지, 세션을 DB(Adapter)로 관리할지 JWT로 관리할지를 정해야 했다.

## Decision

- **Credentials Provider**(이메일 + 비밀번호, `bcryptjs` 해시)만 사용한다. Google OAuth는 붙이지 않는다.
- 세션 전략은 **JWT**. `PrismaAdapter`를 쓰지 않으므로 `Account`/`Session` 모델이 필요 없다.
- `session`/`jwt` 콜백에서 `session.user.id`를 노출해 API 라우트에서 소유권 확인에 쓴다.

## Consequences

- 스키마가 `User`/`Todo` 두 모델로 단순해짐(어댑터용 모델 불필요).
- OAuth를 나중에 추가하려면 이 결정을 재검토하고 어댑터 도입 + `db push`가 필요하다.
- Edge 미들웨어(`proxy.ts`)에서는 `bcryptjs`/Prisma를 직접 쓸 수 없어, 설정을 `auth.config.ts`(Edge-safe) / `auth.ts`(풀 설정, Credentials 포함)로 분리했다.
