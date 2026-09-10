import type { NextAuthConfig } from "next-auth";

// Edge(미들웨어)에서도 안전하게 import 할 수 있는 최소 설정.
// prisma / bcryptjs 등 Node 전용 모듈을 여기서 import 하면 안 된다.
// 실제 Credentials provider(authorize)는 src/lib/auth.ts 에서 추가한다.

/** 로그인해야 접근 가능한 경로 prefix */
const PROTECTED_PREFIXES = ["/today"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // 미들웨어가 이 콜백으로 접근 허용 여부를 판단한다.
    // false 를 반환하면 Auth.js 가 pages.signIn 으로 리다이렉트한다.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PREFIXES.some((p) =>
        nextUrl.pathname.startsWith(p),
      );

      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
} satisfies NextAuthConfig;
