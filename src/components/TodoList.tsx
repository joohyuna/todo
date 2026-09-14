"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import TodoItem from "./TodoItem";
import TodoStats from "./TodoStats";

export type TodoItemData = {
  id: string;
  title: string;
  done: boolean;
  completedAt: Date | null;
};

type OptimisticAction =
  | { type: "toggle"; id: string; done: boolean }
  | { type: "delete"; id: string };

export default function TodoList({ items }: { items: TodoItemData[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [optimistic, applyOptimistic] = useOptimistic(
    items,
    (state, action: OptimisticAction) =>
      action.type === "toggle"
        ? state.map((t) =>
            t.id === action.id
              ? {
                  ...t,
                  done: action.done,
                  completedAt: action.done ? new Date() : null,
                }
              : t,
          )
        : state.filter((t) => t.id !== action.id),
  );

  function toggle(id: string, done: boolean) {
    startTransition(async () => {
      applyOptimistic({ type: "toggle", id, done });
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: "delete", id });
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  if (optimistic.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-400">
        할 일이 없습니다. 위에서 추가해 보세요.
      </p>
    );
  }

  const doneCount = optimistic.filter((t) => t.done).length;

  return (
    <div className="flex flex-col gap-3">
      <TodoStats done={doneCount} total={optimistic.length} />
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200">
        {optimistic.map((t) => (
          <TodoItem key={t.id} todo={t} onToggle={toggle} onDelete={remove} />
        ))}
      </ul>
    </div>
  );
}
