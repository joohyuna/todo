"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-brand-50">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-bold text-zinc-900">
          일간 ToDo
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {status === "authenticated" ? (
            <>
              <span className="text-zinc-500">
                {session.user?.name ?? session.user?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-zinc-700 hover:bg-zinc-50"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-zinc-700 hover:bg-zinc-50"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand-900 px-3 py-1 text-white hover:bg-brand-700"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
