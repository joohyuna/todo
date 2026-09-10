import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todoSchema } from "@/lib/schemas";
import { isDateString } from "@/lib/date";

// GET /api/todos?date=YYYY-MM-DD  — 로그인 사용자의 해당 날짜 목록
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const date = new URL(req.url).searchParams.get("date");
  if (!date || !isDateString(date)) {
    return NextResponse.json({ error: "BAD_DATE" }, { status: 400 });
  }

  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id, date },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, done: true, date: true },
  });

  return NextResponse.json({ todos });
}

// POST /api/todos  { title, date }  — 생성
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = todoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const todo = await prisma.todo.create({
    data: {
      title: parsed.data.title,
      date: parsed.data.date,
      userId: session.user.id,
    },
    select: { id: true, title: true, done: true, date: true },
  });

  return NextResponse.json({ todo }, { status: 201 });
}
