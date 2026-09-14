"use client";

import type { TodoItemData } from "./TodoList";
import { formatTime } from "@/lib/date";

export default function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: TodoItemData;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 text-sm">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={(e) => onToggle(todo.id, e.target.checked)}
        aria-label={`${todo.title} 완료 표시`}
        className="h-4 w-4 shrink-0 accent-zinc-900"
      />
      <span className="flex flex-1 flex-col">
        <span
          className={
            todo.done ? "text-zinc-400 line-through" : "text-zinc-900"
          }
        >
          {todo.title}
        </span>
        {todo.done && todo.completedAt && (
          <span suppressHydrationWarning className="text-xs text-zinc-400">
            {formatTime(new Date(todo.completedAt))} 완료
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`${todo.title} 삭제`}
        className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
      >
        ✕
      </button>
    </li>
  );
}
