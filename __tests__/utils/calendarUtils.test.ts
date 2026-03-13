import {
  getYearMonth,
  getDaysInMonth,
  getFirstDayCol,
  getWeekdayDays,
  getSixDayDays,
  getAllDays,
  generateCalendarWeeks,
} from '../../src/utils/calendarUtils';

describe('getYearMonth', () => {
  test('월이 한 자리면 앞에 0 패딩', () => {
    expect(getYearMonth(2026, 3)).toBe('2026-03');
  });
  test('두 자리 월은 그대로', () => {
    expect(getYearMonth(2026, 12)).toBe('2026-12');
  });
});

describe('getDaysInMonth', () => {
  test('1월은 31일', () => expect(getDaysInMonth(2026, 1)).toBe(31));
  test('2월 평년은 28일', () => expect(getDaysInMonth(2026, 2)).toBe(28));
  test('2월 윤년은 29일', () => expect(getDaysInMonth(2024, 2)).toBe(29));
  test('4월은 30일', () => expect(getDaysInMonth(2026, 4)).toBe(30));
});

describe('getFirstDayCol', () => {
  test('2026년 3월 1일은 일요일(0)', () => {
    expect(getFirstDayCol(2026, 3)).toBe(0);
  });
  test('2026년 1월 1일은 목요일(4)', () => {
    expect(getFirstDayCol(2026, 1)).toBe(4);
  });
});

describe('getWeekdayDays', () => {
  test('평일만 포함 (월~금)', () => {
    const days = getWeekdayDays(2026, 3);
    days.forEach(d => {
      const dow = new Date(2026, 2, d).getDay();
      expect(dow).not.toBe(0); // 일요일 없음
      expect(dow).not.toBe(6); // 토요일 없음
    });
  });
  test('3월 평일 수 = 22일', () => {
    expect(getWeekdayDays(2026, 3).length).toBe(22);
  });
});

describe('getSixDayDays', () => {
  test('일요일 제외 (월~토)', () => {
    const days = getSixDayDays(2026, 3);
    days.forEach(d => {
      expect(new Date(2026, 2, d).getDay()).not.toBe(0);
    });
  });
});

describe('getAllDays', () => {
  test('1월 — 1~31 배열 반환', () => {
    const days = getAllDays(2026, 1);
    expect(days).toHaveLength(31);
    expect(days[0]).toBe(1);
    expect(days[30]).toBe(31);
  });
});

describe('generateCalendarWeeks', () => {
  test('각 주는 7개 셀', () => {
    const weeks = generateCalendarWeeks(2026, 3);
    weeks.forEach(week => expect(week).toHaveLength(7));
  });
  test('첫 셀 오프셋 — 3월 1일이 일요일이면 offset 없음', () => {
    const weeks = generateCalendarWeeks(2026, 3);
    expect(weeks[0][0]).toBe(1); // 일요일 시작이므로 offset 0
  });
  test('null로 빈 셀 채움', () => {
    // 2026년 1월: 1일이 목요일(4) → 앞 4칸 null
    const weeks = generateCalendarWeeks(2026, 1);
    expect(weeks[0][0]).toBeNull();
    expect(weeks[0][3]).toBeNull();
    expect(weeks[0][4]).toBe(1);
  });
  test('마지막 날짜가 31일인 월 검증', () => {
    const weeks = generateCalendarWeeks(2026, 1);
    const allDays = weeks.flat().filter(d => d !== null);
    expect(allDays[allDays.length - 1]).toBe(31);
  });
});
