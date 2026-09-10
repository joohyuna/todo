import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDateString } from "@/lib/date";
import TodayRedirect from "@/components/TodayRedirect";
import DateNav from "@/components/DateNav";
import AddTodoForm from "@/components/AddTodoForm";
import TodoList from "@/components/TodoList";

export const metadata = { title: "오늘 할 일 · 일간 ToDo" };

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login"); // 미들웨어 외 2차 방어

  const { date } = await searchParams;
  if (!date || !isDateString(date)) {
    // 로컬 기준 오늘로 URL 을 채우도록 클라이언트에 위임
    return <TodayRedirect />;
  }

  const items = await prisma.todo.findMany({
    where: { userId: session.user.id, date },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, done: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="sr-only">{date} 할 일</h1>
      <DateNav date={date} />
      <AddTodoForm date={date} />
      <TodoList items={items} />
    </main>
  );
}
