"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, getWeekDates, todayString } from "@/lib/date";
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
  const [weekDots, setWeekDots] = useState<Set<string> | null>(null);

  const rel = relativeLabel(date);
  const isToday = date === todayString();
  const month = date.slice(0, 7);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/todos/summary?month=${month}`)
      .then((res) => res.json())
      .then((data: { dates?: string[] }) => {
        if (!cancelled) setWeekDots(new Set(data.dates ?? []));
      })
      .catch(() => {
        if (!cancelled) setWeekDots(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

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

      <div className="grid w-full grid-cols-7 gap-1">
        {getWeekDates(date).map((d, i) => {
          const day = Number(d.split("-")[2]);
          const isSelected = d === date;
          const hasTodo = weekDots?.has(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => go(d)}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs ${
                isSelected
                  ? "bg-brand-900 text-white"
                  : "text-zinc-600 hover:bg-brand-50"
              }`}
            >
              <span>{WEEK[i]}</span>
              <span className="text-sm font-medium">{day}</span>
              <span
                className={`h-1 w-1 rounded-full ${
                  hasTodo && !isSelected ? "bg-brand-500" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
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
