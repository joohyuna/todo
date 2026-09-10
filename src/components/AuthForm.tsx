"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  loginSchema,
  registerSchema,
  type RegisterInput,
} from "@/lib/schemas";

type Props = {
  mode: "login" | "register";
  /** 폼 위에 보여줄 안내 문구 (예: 가입 완료 후 로그인 유도) */
  notice?: string;
};

// login 모드에선 nickname 필드를 렌더/등록하지 않는다. 값 타입은 register 기준(상위집합)으로 둔다.
type FormValues = RegisterInput;

export default function AuthForm({ mode, notice }: Props) {
  const isRegister = mode === "register";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      isRegister ? registerSchema : loginSchema,
    ) as unknown as Resolver<FormValues>,
    mode: "onTouched",
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    if (isRegister) {
      let res: Response;
      try {
        res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      } catch {
        setServerError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      if (res.status === 201) {
        window.location.assign("/login?registered=1");
        return;
      }
      if (res.status === 409) {
        setServerError("이미 등록된 이메일입니다.");
        return;
      }
      setServerError("가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    // login
    const result = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });
    if (!result || result.error) {
      setServerError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    window.location.assign("/today");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold text-zinc-900">
        {isRegister ? "회원가입" : "로그인"}
      </h1>

      {notice && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {notice}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {isRegister && (
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-zinc-700">
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              autoComplete="nickname"
              {...register("nickname")}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
            {errors.nickname && (
              <p className="mt-1 text-xs text-red-600">{errors.nickname.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            {...register("password")}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isSubmitting
            ? "처리 중…"
            : isRegister
              ? "가입하기"
              : "로그인"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        {isRegister ? (
          <>
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-zinc-900 underline">
              로그인
            </Link>
          </>
        ) : (
          <>
            계정이 없으신가요?{" "}
            <Link href="/register" className="font-medium text-zinc-900 underline">
              회원가입
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
