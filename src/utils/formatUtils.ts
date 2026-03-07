/**
 * 숫자를 천 단위 콤마가 포함된 통화 형식 문자열로 변환합니다.
 * @example formatCurrency(1234567) → "1,234,567"
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('ko-KR');
};

/**
 * 숫자 문자열에 천 단위 콤마를 추가합니다 (입력 필드 표시용).
 * @example formatNumberInput("1234567") → "1,234,567"
 */
export const formatNumberInput = (value: string): string => {
  const numeric = value.replace(/[^0-9]/g, '');
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 문자열에서 숫자 이외의 문자를 제거합니다 (입력값 파싱용).
 * @example parseNumericInput("1,234,567") → "1234567"
 */
export const parseNumericInput = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};
