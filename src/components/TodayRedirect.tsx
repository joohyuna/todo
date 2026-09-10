"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { todayString } from "@/lib/date";

// /today 에 ?date 가 없을 때, 클라이언트 로컬 기준 오늘로 URL 을 교체한다.
export default function TodayRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/today?date=${todayString()}`);
  }, [router]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-16 text-sm text-zinc-400">
      불러오는 중…
    </main>
  );
}
