import { renderHook } from '../helpers/renderHook';
import { useMonthlyReport } from '../../src/hooks/useMonthlyReport';
import renderer from 'react-test-renderer';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUserGet = jest.fn();
const mockRevenuesGet = jest.fn();
const mockExpensesGet = jest.fn();

jest.mock('../../src/lib/firebase', () => ({
  firebaseAuth: { currentUser: { uid: 'test-uid' } },
  firebaseDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: mockUserGet,
        collection: jest.fn((colName) => ({
          where: jest.fn().mockReturnThis(),
          get: colName === 'revenues' ? mockRevenuesGet : mockExpensesGet,
        })),
      })),
    })),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper to flush promises (setTimeout 기반)
const flushPromises = () => new Promise(setImmediate);

describe('useMonthlyReport — 공백/빈 데이터 예외 처리', () => {
  test('누락된 필드(amount, source, dateStr, timestamp)가 기본값으로 안전하게 처리된다', async () => {
    mockUserGet.mockResolvedValue({ data: () => ({ monthlyGoal: 50000 }) });
    
    // 빈 데이터, 잘못된 형태의 데이터 모의
    mockRevenuesGet.mockResolvedValue({
      docs: [
        {
          data: () => ({
            // 모든 필드 누락
          }),
        },
        {
          data: () => ({
            amount: null,
            source: null,
            dateStr: '', // 빈 문자열은 fasalsy로 처리되어 if(data.dateStr)를 통과하지 않음
            // timestamp 없음
          }),
        },
        {
          data: () => ({
            amount: undefined,
            source: undefined,
          }),
        }
      ],
    });

    mockExpensesGet.mockResolvedValue({
      docs: [
        {
          data: () => ({
            // 지출액(amount) 누락
          }),
        },
      ],
    });

    const date = new Date('2026-03-13T12:00:00Z');
    const { result } = renderHook(() => useMonthlyReport(date));

    // hook 내의 비동기 fetchMonthData가 완료될 때까지 대기
    await renderer.act(async () => {
      await flushPromises();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    // 값이 누락되었을 경우 total, expense는 모두 0이 되어야 함
    expect(result.current.current.total).toBe(0);
    expect(result.current.current.expense).toBe(0);
    expect(result.current.current.netProfit).toBe(0);
    
    // source가 누락된 경우 'other' 항목으로 분류됨
    expect(result.current.current.bySource.other).toBe(0);
    expect(result.current.current.bySource.kakao).toBe(0);
    
    // 유효한 dateStr이 없었으므로 workingDays는 0이 되어야 함
    expect(result.current.current.workingDays).toBe(0);
    expect(result.current.current.dailyAvg).toBe(0);
  });

  test('부분적으로 존재하는 필드에 대해서도 안전하게 연산된다', async () => {
    mockUserGet.mockResolvedValue({ data: () => ({ monthlyGoal: 50000 }) });
    
    mockRevenuesGet.mockResolvedValue({
      docs: [
        {
          data: () => ({
            amount: 5000,
            // source 없음 -> 'other'로 간주되어야 함
            // dateStr 없음 -> 리포트에 카운팅되지 않음
            // timestamp 없음
          }),
        },
      ],
    });
    mockExpensesGet.mockResolvedValue({ docs: [] });

    const date = new Date('2026-03-13T12:00:00Z');
    const { result } = renderHook(() => useMonthlyReport(date));

    await renderer.act(async () => {
      await flushPromises();
    });

    // 누락되지 않은 amount 값은 정상적으로 계산됨
    expect(result.current.current.total).toBe(5000);
    
    // 소스가 없으면 'other'로 분류되어 누적됨
    expect(result.current.current.bySource.other).toBe(5000);
    expect(result.current.current.bySource.kakao).toBe(0);
    
    // dateStr이 없으므로 workingDays는 카운팅되지 않음
    expect(result.current.current.workingDays).toBe(0);
    expect(result.current.current.dailyAvg).toBe(0); // workingDays가 없으므로 평균은 0
  });
});
