import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todoSchema } from "@/lib/schemas";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const patchSchema = z
  .object({
    done: z.boolean().optional(),
    title: todoSchema.shape.title.optional(),
  })
  .refine((v) => v.done !== undefined || v.title !== undefined, {
    message: "변경할 내용이 없습니다.",
  });

type Ctx = { params: Promise<{ id: string }> };

/** 로그인 + 소유권 확인. 통과하면 todo id 반환, 아니면 응답(Response) 반환. */
async function guard(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  if (!OBJECT_ID_RE.test(id)) {
    return { error: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) };
  }
  const todo = await prisma.todo.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!todo) {
    return { error: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) };
  }
  return { ok: true as const };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data: { done?: boolean; title?: string; completedAt?: Date | null } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.done !== undefined) {
    data.done = parsed.data.done;
    data.completedAt = parsed.data.done ? new Date() : null;
  }

  const todo = await prisma.todo.update({
    where: { id },
    data,
    select: { id: true, title: true, done: true },
  });

  return NextResponse.json({ todo });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;

  await prisma.todo.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
