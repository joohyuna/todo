"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, getMonthMatrix } from "@/lib/date";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export default function MonthCalendar({
  selectedDate,
  onClose,
}: {
  selectedDate: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [viewMonth, setViewMonth] = useState(() => selectedDate.slice(0, 7));
  const [dates, setDates] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDates(null);
    fetch(`/api/todos/summary?month=${viewMonth}`)
      .then((res) => res.json())
      .then((data: { dates?: string[] }) => {
        if (!cancelled) setDates(new Set(data.dates ?? []));
      })
      .catch(() => {
        if (!cancelled) setDates(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [viewMonth]);

  function pick(d: string) {
    router.push(`/today?date=${d}`);
    onClose();
  }

  const matrix = getMonthMatrix(viewMonth);
  const [y, m] = viewMonth.split("-").map(Number);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewMonth((v) => addMonths(v, -1))}
            aria-label="이전 달"
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-zinc-900">
            {y}년 {m}월
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMonth((v) => addMonths(v, 1))}
              aria-label="다음 달"
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              ›
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
          {WEEK.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {matrix.flatMap((row, ri) =>
            row.map((cell, ci) => {
              if (!cell) return <div key={`${ri}-${ci}`} />;
              const day = Number(cell.split("-")[2]);
              const isSelected = cell === selectedDate;
              const hasTodo = dates?.has(cell);
              return (
                <button
                  key={cell}
                  type="button"
                  onClick={() => pick(cell)}
                  className={`flex flex-col items-center gap-0.5 rounded-full py-1.5 text-sm ${
                    isSelected
                      ? "bg-brand-900 text-white"
                      : "text-zinc-700 hover:bg-brand-50"
                  }`}
                >
                  <span>{day}</span>
                  <span
                    className={`h-1 w-1 rounded-full ${
                      hasTodo && !isSelected ? "bg-brand-500" : "bg-transparent"
                    }`}
                  />
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
