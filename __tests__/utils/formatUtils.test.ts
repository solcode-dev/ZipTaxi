import { formatCurrency, formatNumberInput, parseNumericInput } from '../../src/utils/formatUtils';

describe('formatCurrency', () => {
  test('천 단위 콤마 포맷', () => {
    expect(formatCurrency(18400)).toBe('18,400');
  });
  test('백만 단위 포맷', () => {
    expect(formatCurrency(1234567)).toBe('1,234,567');
  });
  test('0 처리', () => {
    expect(formatCurrency(0)).toBe('0');
  });
  test('음수 처리', () => {
    expect(formatCurrency(-5000)).toBe('-5,000');
  });
  test('1000 미만 포맷 (콤마 없음)', () => {
    expect(formatCurrency(999)).toBe('999');
  });
});

describe('formatNumberInput', () => {
  test('숫자 문자열에 콤마 추가', () => {
    expect(formatNumberInput('1234567')).toBe('1,234,567');
  });
  test('이미 콤마 있는 문자열 재포맷', () => {
    expect(formatNumberInput('1,234,567')).toBe('1,234,567');
  });
  test('빈 문자열 처리', () => {
    expect(formatNumberInput('')).toBe('');
  });
  test('숫자 이외 문자 제거 후 포맷', () => {
    expect(formatNumberInput('1abc234')).toBe('1,234');
  });
});

describe('parseNumericInput', () => {
  test('콤마 제거', () => {
    expect(parseNumericInput('1,234,567')).toBe('1234567');
  });
  test('숫자만 있는 문자열 그대로 반환', () => {
    expect(parseNumericInput('12345')).toBe('12345');
  });
  test('빈 문자열 처리', () => {
    expect(parseNumericInput('')).toBe('');
  });
  test('문자 혼합 입력에서 숫자만 추출', () => {
    expect(parseNumericInput('abc123def456')).toBe('123456');
  });
});
