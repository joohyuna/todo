"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { todoSchema } from "@/lib/schemas";

const formSchema = todoSchema.pick({ title: true });
type FormValues = { title: string };

export default function AddTodoForm({ date }: { date: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    let res: Response;
    try {
      res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: values.title, date }),
      });
    } catch {
      setServerError("네트워크 오류가 발생했습니다.");
      return;
    }

    if (!res.ok) {
      setServerError("추가하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    reset({ title: "" });
    setFocus("title");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          {...register("title")}
          type="text"
          placeholder="할 일을 입력하세요"
          autoComplete="off"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          추가
        </button>
      </div>
      {errors.title && (
        <p className="text-xs text-red-600">{errors.title.message}</p>
      )}
      {serverError && <p className="text-xs text-red-600">{serverError}</p>}
    </form>
  );
}
