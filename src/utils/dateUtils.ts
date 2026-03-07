export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Date 객체를 YYYY-MM-DD 형식 문자열로 변환합니다.
 * toISOString()과 달리 로컬 시간대를 기준으로 합니다.
 */
export const toDateStr = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 오늘 날짜의 YYYY-MM-DD 문자열을 반환합니다.
 */
export const getTodayStr = (): string => toDateStr(new Date());

/**
 * 이번 달의 남은 일수를 반환합니다 (오늘 포함, 최소 1).
 */
export const getRemainingDaysInMonth = (date: Date = new Date()): number => {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(1, lastDay - date.getDate() + 1);
};

/**
 * 주어진 날짜가 속한 주의 월요일 0시 Date 객체를 반환합니다.
 */
export const getMondayOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0(일) ~ 6(토)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * YYYY-MM-DD 문자열을 "M월 D일 (요일)" 형식으로 변환합니다.
 * @example getDayLabel("2024-01-20") → "1월 20일 (토)"
 */
export const getDayLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
};

/**
 * Date 객체를 "YYYY년 M월" 형식으로 변환합니다.
 * @example formatMonthTitle(new Date(2024, 0)) → "2024년 1월"
 */
export const formatMonthTitle = (date: Date): string => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};

/**
 * 해당 월의 시작일과 마지막일 YYYY-MM-DD 문자열을 반환합니다.
 */
export const getMonthRange = (date: Date): { startStr: string; endStr: string } => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  const m = String(month).padStart(2, '0');
  return {
    startStr: `${year}-${m}-01`,
    endStr: `${year}-${m}-${String(lastDay).padStart(2, '0')}`,
  };
};
