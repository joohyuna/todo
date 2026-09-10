"use client";

import type { TodoItemData } from "./TodoList";

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
      <span
        className={`flex-1 ${
          todo.done ? "text-zinc-400 line-through" : "text-zinc-900"
        }`}
      >
        {todo.title}
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
