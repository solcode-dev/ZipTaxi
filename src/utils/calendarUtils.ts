/** YYYY-MM 형식의 문자열을 반환합니다. */
export function getYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** 해당 연월의 총 일수를 반환합니다. */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 해당 월 1일의 요일(0=일, 6=토)을 반환합니다. (달력 첫 열 오프셋) */
export function getFirstDayCol(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/** 평일만 (월~금) 근무일 배열을 반환합니다. */
export function getWeekdayDays(year: number, month: number): number[] {
  const days: number[] = [];
  const total = getDaysInMonth(year, month);
  for (let d = 1; d <= total; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) days.push(d);
  }
  return days;
}

/** 주 6일 (월~토) 근무일 배열을 반환합니다. */
export function getSixDayDays(year: number, month: number): number[] {
  const days: number[] = [];
  const total = getDaysInMonth(year, month);
  for (let d = 1; d <= total; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0) days.push(d);
  }
  return days;
}

/** 해당 월의 모든 날짜 배열을 반환합니다. */
export function getAllDays(year: number, month: number): number[] {
  return Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);
}

export type CalendarWeek = (number | null)[];

/**
 * 달력 주(week) 배열을 생성합니다.
 * 각 week는 7개 셀로 구성되며, 날짜가 없는 셀은 null입니다.
 */
export function generateCalendarWeeks(year: number, month: number): CalendarWeek[] {
  const firstCol = getFirstDayCol(year, month);
  const total = getDaysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstCol).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}
