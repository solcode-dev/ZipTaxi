import {
  toDateStr,
  getRemainingDaysInMonth,
  getMondayOfWeek,
  getDayLabel,
  formatMonthTitle,
  getMonthRange,
} from '../../src/utils/dateUtils';

describe('toDateStr', () => {
  test('Date 객체를 YYYY-MM-DD 형식으로 변환', () => {
    expect(toDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  test('월/일이 한 자리일 때 앞에 0 패딩', () => {
    expect(toDateStr(new Date(2026, 2, 9))).toBe('2026-03-09');
  });
});

describe('getRemainingDaysInMonth', () => {
  test('월 마지막 날이면 1 반환', () => {
    expect(getRemainingDaysInMonth(new Date(2026, 0, 31))).toBe(1);
  });
  test('1월 1일이면 31 반환', () => {
    expect(getRemainingDaysInMonth(new Date(2026, 0, 1))).toBe(31);
  });
  test('2월 말일 처리 (평년 28일)', () => {
    expect(getRemainingDaysInMonth(new Date(2026, 1, 28))).toBe(1);
  });
});

describe('getMondayOfWeek', () => {
  test('월요일이면 그대로 반환', () => {
    const monday = new Date(2026, 2, 9); // 2026-03-09 월요일
    const result = getMondayOfWeek(monday);
    expect(result.getDate()).toBe(9);
    expect(result.getDay()).toBe(1);
  });
  test('일요일이면 이전 주 월요일 반환', () => {
    const sunday = new Date(2026, 2, 8); // 2026-03-08 일요일
    const result = getMondayOfWeek(sunday);
    expect(result.getDate()).toBe(2);
    expect(result.getDay()).toBe(1);
  });
  test('토요일이면 같은 주 월요일 반환', () => {
    const saturday = new Date(2026, 2, 14); // 2026-03-14 토요일
    const result = getMondayOfWeek(saturday);
    expect(result.getDate()).toBe(9);
  });
  test('시간이 00:00:00으로 초기화', () => {
    const result = getMondayOfWeek(new Date(2026, 2, 11, 15, 30));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});

describe('getDayLabel', () => {
  test('"M월 D일 (요일)" 형식 반환', () => {
    expect(getDayLabel('2026-03-09')).toBe('3월 9일 (월)');
  });
  test('1월 1일 처리', () => {
    expect(getDayLabel('2026-01-01')).toBe('1월 1일 (목)');
  });
});

describe('formatMonthTitle', () => {
  test('"YYYY년 M월" 형식 반환', () => {
    expect(formatMonthTitle(new Date(2026, 0))).toBe('2026년 1월');
  });
  test('12월 처리', () => {
    expect(formatMonthTitle(new Date(2025, 11))).toBe('2025년 12월');
  });
});

describe('getMonthRange', () => {
  test('1월 범위 반환', () => {
    const { startStr, endStr } = getMonthRange(new Date(2026, 0));
    expect(startStr).toBe('2026-01-01');
    expect(endStr).toBe('2026-01-31');
  });
  test('2월 범위 반환 (평년)', () => {
    const { startStr, endStr } = getMonthRange(new Date(2026, 1));
    expect(startStr).toBe('2026-02-01');
    expect(endStr).toBe('2026-02-28');
  });
  test('4월 범위 반환 (30일)', () => {
    const { startStr, endStr } = getMonthRange(new Date(2026, 3));
    expect(endStr).toBe('2026-04-30');
  });
});
