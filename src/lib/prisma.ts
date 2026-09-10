import { PrismaClient } from "@prisma/client";

// dev 에서 HMR/재실행 시 PrismaClient 인스턴스가 계속 늘어나 커넥션이 폭증하는 것을 막기 위해
// globalThis 에 하나만 캐싱한다.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
