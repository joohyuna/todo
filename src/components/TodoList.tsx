"use client";

export type TodoItemData = {
  id: string;
  title: string;
  done: boolean;
};

export default function TodoList({ items }: { items: TodoItemData[] }) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-400">
        할 일이 없습니다. 위에서 추가해 보세요.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
      {items.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm">
          <span
            aria-hidden
            className={`h-4 w-4 shrink-0 rounded border ${
              t.done ? "border-zinc-900 bg-zinc-900" : "border-zinc-300"
            }`}
          />
          <span className={t.done ? "text-zinc-400 line-through" : "text-zinc-900"}>
            {t.title}
          </span>
        </li>
      ))}
    </ul>
  );
}
