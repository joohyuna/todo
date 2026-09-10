import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next 16 에서 `middleware` 는 `proxy` 로 이름이 바뀌었다.
// authConfig(prisma/bcrypt 없음)만 사용해 Edge 런타임에서 돈다.
export default NextAuth(authConfig).auth;

export const config = {
  // 보호 경로만. API 라우트는 각 핸들러에서 auth()로 직접 401 처리.
  matcher: ["/today", "/today/:path*"],
};
