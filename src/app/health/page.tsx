import { prisma } from "@/lib/prisma";

// [임시] DB 연결 확인용 페이지 — 단계 9에서 삭제.
export const dynamic = "force-dynamic";

export default async function HealthPage() {
  let status: "ok" | "error" = "ok";
  let detail = "";
  let users = 0;
  let todos = 0;

  try {
    [users, todos] = await Promise.all([
      prisma.user.count(),
      prisma.todo.count(),
    ]);
  } catch (e) {
    status = "error";
    detail = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold text-zinc-900">DB 연결 상태</h1>

      <div
        className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          status === "ok"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        {status === "ok"
          ? "✓ MongoDB Atlas 연결 성공"
          : "✗ 연결 실패"}
      </div>

      {status === "ok" ? (
        <dl className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6">
            <dt className="text-xs uppercase tracking-wide text-zinc-400">
              users
            </dt>
            <dd className="mt-1 text-3xl font-bold text-zinc-900">{users}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6">
            <dt className="text-xs uppercase tracking-wide text-zinc-400">
              todos
            </dt>
            <dd className="mt-1 text-3xl font-bold text-zinc-900">{todos}</dd>
          </div>
        </dl>
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs text-red-300">
          {detail}
        </pre>
      )}

      <p className="text-xs text-zinc-400">
        이 페이지는 개발 확인용이며 배포 전에 삭제됩니다.
      </p>
    </main>
  );
}
