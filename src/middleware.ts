import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge 런타임에서 도는 미들웨어. authConfig(prisma/bcrypt 없음)만 사용한다.
export default NextAuth(authConfig).auth;

export const config = {
  // 보호 경로만 미들웨어를 태운다. API 라우트는 각 핸들러에서 auth()로 직접 401 처리.
  matcher: ["/today", "/today/:path*"],
};
