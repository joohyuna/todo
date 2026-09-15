# ADR-0003: Prisma 6.19.3 고정, 커스텀 client output 미지정

- **Status**: Accepted

## Context

Prisma ORM으로 MongoDB Atlas를 사용하기로 했다. 최신 Prisma(7/8)를 쓸지, 6.x를 쓸지 결정이 필요했다. 또한 `prisma-client-js` 생성기의 `output`을 커스텀 경로로 지정할지, 기본 위치(node_modules)로 둘지도 결정이 필요했다.

## Decision

- `prisma` / `@prisma/client`를 **6.19.3**으로 고정한다. Prisma 7/8은 이 시점 기준 MongoDB provider를 지원하지 않는다.
- `generator client`에 `output`을 지정하지 않는다 — 기본 위치(node_modules)에 생성한다. Next.js 16 + Turbopack 조합에서 커스텀 output은 파일 트레이싱 경고를 유발한다.
- `import { PrismaClient } from "@prisma/client"`(기본 경로)로 통일한다.
- `package.json`에 `postinstall: prisma generate`, `build: prisma generate && next build`를 둬서 Vercel 빌드 캐시로 인한 client 누락을 방지한다.
- `pnpm-workspace.yaml`의 `allowBuilds`에 `@prisma/client`·`@prisma/engines`·`prisma`를 `true`로 등록해 엔진 다운로드/클라이언트 생성을 허용한다.

## Consequences

- MongoDB가 Prisma 7/8에서 지원되기 전까지는 6.x 라인에 머문다. `prisma`를 7.x 이상으로 임의로 올리지 않는다(`CLAUDE.md` 가드레일 참고).
- 새 환경에서 `pnpm install` 시 `allowBuilds` 설정이 없으면 클라이언트 생성이 막힐 수 있음 — 이 설정을 지우지 않는다.
