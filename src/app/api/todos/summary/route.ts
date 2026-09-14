import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthRange, isMonthString } from "@/lib/date";

// GET /api/todos/summary?month=YYYY-MM — 해당 월에 할 일이 있는 날짜 목록 (캘린더 dot 표시용)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const month = new URL(req.url).searchParams.get("month");
  if (!month || !isMonthString(month)) {
    return NextResponse.json({ error: "BAD_MONTH" }, { status: 400 });
  }

  const { start, end } = getMonthRange(month);
  const rows = await prisma.todo.findMany({
    where: { userId: session.user.id, date: { gte: start, lte: end } },
    select: { date: true },
    distinct: ["date"],
  });

  return NextResponse.json({ dates: rows.map((r) => r.date) });
}
