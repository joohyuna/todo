import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const steps = [
  { id: 0, label: "프로젝트 스캐폴딩 (Next.js + TS + Tailwind + pnpm)", done: true },
  { id: 1, label: "DB 연결 (Prisma + MongoDB Atlas)", done: true },
  { id: 2, label: "공용 검증 스키마 (zod)", done: true },
  { id: 3, label: "회원가입 페이지 /register", done: true },
  { id: 4, label: "로그인 페이지 /login + 세션", done: true },
  { id: 5, label: "라우트 보호 (middleware)", done: true },
  { id: 6, label: "오늘 ToDo 페이지 /today (조회 + 추가)", done: false },
  { id: 7, label: "ToDo 완료 토글 / 삭제", done: false },
  { id: 8, label: "날짜 네비게이션 (일간 뷰 완성)", done: false },
  { id: 9, label: "마무리 & 배포 준비", done: false },
];

export default async function Home() {
  // 로그인 상태면 바로 오늘 할 일 화면으로. 비로그인은 아래 진행 현황(랜딩)을 본다.
  const session = await auth();
  if (session?.user) redirect("/today");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600">일간 ToDo 앱</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          개발 진행 상황
        </h1>
        <p className="text-zinc-500">
          페이지 단위로 하나씩 완성해 나갑니다. 현재 단계 5 완료.
        </p>
      </header>

      <ol className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
              step.done
                ? "border-blue-200 bg-blue-50 text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-400"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {step.done ? "✓" : step.id}
            </span>
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
