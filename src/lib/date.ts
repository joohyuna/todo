// ToDo 는 날짜를 "YYYY-MM-DD" 문자열로 저장한다(옵션 A).
// "며칠"인지는 항상 클라이언트의 로컬 날짜 기준으로 정한다.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 주어진 Date(기본: 지금)를 로컬 기준 "YYYY-MM-DD" 로 */
export function toDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 브라우저 로컬 기준 오늘 */
export function todayString(): string {
  return toDateString();
}

/** "YYYY-MM-DD" 형식이면서 실재하는 날짜인지 (서버·클라이언트 공용) */
export function isDateString(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

/** date 문자열에 일수를 더한 새 "YYYY-MM-DD" (음수 가능) — 단계 8 DateNav 용 */
export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateString(new Date(y, m - 1, d + delta));
}
