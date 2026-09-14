"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  getMonthMatrix,
  getWeekDates,
  todayString,
} from "@/lib/date";

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

function DayCell({
  dateStr,
  top,
  bottom,
  selected,
  hasTodo,
  onSelect,
}: {
  dateStr: string;
  top?: string;
  bottom: string;
  selected: boolean;
  hasTodo: boolean;
  onSelect: (d: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(dateStr)}
      className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs ${
        selected ? "bg-brand-900 text-white" : "text-zinc-600 hover:bg-brand-50"
      }`}
    >
      {top && <span>{top}</span>}
      <span className="text-sm font-medium">{bottom}</span>
      <span
        className={`h-1 w-1 rounded-full ${
          hasTodo && !selected ? "bg-brand-500" : "bg-transparent"
        }`}
      />
    </button>
  );
}

export default function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const go = (d: string) => router.push(`/today?date=${d}`);

  const [mode, setMode] = useState<"week" | "month">("week");
  const [viewMonth, setViewMonth] = useState(() => date.slice(0, 7));
  const [monthDots, setMonthDots] = useState<Set<string> | null>(null);

  const rel = relativeLabel(date);
  const isToday = date === todayString();
  const activeMonth = mode === "month" ? viewMonth : date.slice(0, 7);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/todos/summary?month=${activeMonth}`)
      .then((res) => res.json())
      .then((data: { dates?: string[] }) => {
        if (!cancelled) setMonthDots(new Set(data.dates ?? []));
      })
      .catch(() => {
        if (!cancelled) setMonthDots(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [activeMonth]);

  const [vy, vm] = viewMonth.split("-").map(Number);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full rounded-full bg-brand-50 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMode("week")}
          className={`flex-1 rounded-full py-1.5 ${
            mode === "week" ? "bg-brand-900 text-white" : "text-zinc-600"
          }`}
        >
          주간보기
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMonth(date.slice(0, 7));
            setMode("month");
          }}
          className={`flex-1 rounded-full py-1.5 ${
            mode === "month" ? "bg-brand-900 text-white" : "text-zinc-600"
          }`}
        >
          월간보기
        </button>
      </div>

      {mode === "week" ? (
        <>
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
              {rel && (
                <span className="text-xs font-medium text-blue-600">{rel}</span>
              )}
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
            {getWeekDates(date).map((d, i) => (
              <DayCell
                key={d}
                dateStr={d}
                top={WEEK[i]}
                bottom={String(Number(d.split("-")[2]))}
                selected={d === date}
                hasTodo={monthDots?.has(d) ?? false}
                onSelect={go}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((v) => addMonths(v, -1))}
              aria-label="이전 달"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-zinc-900">
              {vy}년 {vm}월
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((v) => addMonths(v, 1))}
              aria-label="다음 달"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              ›
            </button>
          </div>

          <div className="grid w-full grid-cols-7 gap-1 text-center text-xs text-zinc-400">
            {WEEK.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid w-full grid-cols-7 gap-1">
            {getMonthMatrix(viewMonth).flatMap((row, ri) =>
              row.map((cell, ci) =>
                cell ? (
                  <DayCell
                    key={cell}
                    dateStr={cell}
                    bottom={String(Number(cell.split("-")[2]))}
                    selected={cell === date}
                    hasTodo={monthDots?.has(cell) ?? false}
                    onSelect={go}
                  />
                ) : (
                  <div key={`${ri}-${ci}`} />
                ),
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
