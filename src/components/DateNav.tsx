"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, todayString } from "@/lib/date";
import MonthCalendar from "./MonthCalendar";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = WEEK[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${dow})`;
}

function relativeLabel(date: string): string | null {
  const today = todayString();
  if (date === today) return "오늘";
  if (date === addDays(today, -1)) return "어제";
  if (date === addDays(today, 1)) return "내일";
  return null;
}

export default function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const go = (d: string) => router.push(`/today?date=${d}`);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const rel = relativeLabel(date);
  const isToday = date === todayString();

  return (
    <div className="flex flex-col items-center gap-2">
    <div className="flex w-full items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => go(addDays(date, -1))}
        aria-label="이전 날"
        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        ‹
      </button>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm font-semibold text-zinc-900">
          {formatDate(date)}
        </span>
        {rel && <span className="text-xs font-medium text-blue-600">{rel}</span>}
        {!isToday && (
          <button
            type="button"
            onClick={() => go(todayString())}
            className="text-xs text-zinc-400 underline hover:text-zinc-700"
          >
            오늘로
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => go(addDays(date, 1))}
        aria-label="다음 날"
        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        ›
      </button>
    </div>

      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        className="rounded-full border border-brand-900 px-3 py-1.5 text-xs font-medium text-brand-900 hover:bg-brand-50"
      >
        전체 캘린더 보기
      </button>

      {calendarOpen && (
        <MonthCalendar
          selectedDate={date}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}
