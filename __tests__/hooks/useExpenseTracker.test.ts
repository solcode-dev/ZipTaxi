import { renderHook } from '../helpers/renderHook';
import { useExpenseTracker } from '../../src/hooks/useExpenseTracker';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUpdate = jest.fn();
const mockSet    = jest.fn();
const mockDelete = jest.fn();
const mockGet    = jest.fn();
const mockUserRef = {};

jest.mock('../../src/lib/firebase', () => ({
  firebaseAuth: { currentUser: { uid: 'test-uid' } },
  firebaseDb: {},
  Timestamp: { fromDate: (d: Date) => d },
}));

jest.mock('@react-native-firebase/firestore', () => ({
  doc: jest.fn(() => mockUserRef),
  collection: jest.fn(() => ({ id: 'mock-col' })),
  runTransaction: jest.fn(async (_db: unknown, cb: (tx: unknown) => Promise<void>) => cb({
    get: mockGet,
    update: mockUpdate,
    set: mockSet,
    delete: mockDelete,
  })),
}));

jest.mock('../../src/utils/dateUtils', () => ({
  getTodayStr: jest.fn(() => '2026-03-13'),
}));

// ─── 기본 유저 문서 데이터 ─────────────────────────────────────────────────────

const baseUserData = () => ({
  todayExpense:   5000,
  monthlyExpense: 30000,
  lastExpenseDate: '2026-03-13',
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ exists: true, data: () => baseUserData() });
});

// ─── addExpense ───────────────────────────────────────────────────────────────

describe('addExpense — 입력 유효성 검사', () => {
  test('amount가 0이면 false 반환', async () => {
    const { result } = renderHook(() => useExpenseTracker());
    expect(await result.current.addExpense(0, 'fuel')).toBe(false);
  });

  test('amount가 음수이면 false 반환', async () => {
    const { result } = renderHook(() => useExpenseTracker());
    expect(await result.current.addExpense(-500, 'fuel')).toBe(false);
  });
});

describe('addExpense — 트랜잭션 성공', () => {
  test('저장 성공 시 true 반환', async () => {
    const { result } = renderHook(() => useExpenseTracker());
    expect(await result.current.addExpense(3000, 'fuel')).toBe(true);
  });

  test('todayExpense, monthlyExpense 누적', async () => {
    const { result } = renderHook(() => useExpenseTracker());
    await result.current.addExpense(2000, 'meals');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({
        todayExpense:   7000,  // 5000 + 2000
        monthlyExpense: 32000, // 30000 + 2000
      }),
    );
  });

  test('날짜가 다르면 todayExpense를 0에서 시작', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseUserData(), lastExpenseDate: '2026-03-12' }),
    });

    const { result } = renderHook(() => useExpenseTracker());
    await result.current.addExpense(1000, 'fuel');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ todayExpense: 1000 }),
    );
  });

  test('다른 달이면 monthlyExpense를 0에서 시작', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseUserData(), lastExpenseDate: '2026-02-28' }),
    });

    const { result } = renderHook(() => useExpenseTracker());
    await result.current.addExpense(4000, 'maintenance');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ monthlyExpense: 4000 }),
    );
  });

  test('지출 서브컬렉션에 문서 생성', async () => {
    const { result } = renderHook(() => useExpenseTracker());
    await result.current.addExpense(3000, 'fuel', '주유');

    expect(mockSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ amount: 3000, category: 'fuel', note: '주유' }),
    );
  });

  test('사용자 문서 없으면 false 반환', async () => {
    mockGet.mockResolvedValue({ exists: false });
    const { result } = renderHook(() => useExpenseTracker());
    expect(await result.current.addExpense(3000, 'fuel')).toBe(false);
  });
});

// ─── deleteExpense ────────────────────────────────────────────────────────────

describe('deleteExpense — 트랜잭션 성공', () => {
  test('삭제 성공 시 true 반환', async () => {
    const { result } = renderHook(() => useExpenseTracker());
    expect(await result.current.deleteExpense('exp1', 2000, '2026-03-13')).toBe(true);
  });

  test('오늘 날짜 지출 삭제 시 todayExpense 차감', async () => {
    const { result } = renderHook(() => useExpenseTracker());
    await result.current.deleteExpense('exp1', 2000, '2026-03-13');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ todayExpense: 3000 }), // 5000 - 2000
    );
  });

  test('과거 날짜 지출 삭제 시 todayExpense 유지', async () => {
    const { result } = renderHook(() => useExpenseTracker());
    await result.current.deleteExpense('exp1', 2000, '2026-03-10');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ todayExpense: 5000 }), // 변경 없음
    );
  });

  test('삭제 후 음수 방지 (Math.max 적용)', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseUserData(), todayExpense: 500, monthlyExpense: 500 }),
    });

    const { result } = renderHook(() => useExpenseTracker());
    await result.current.deleteExpense('exp1', 2000, '2026-03-13'); // 2000 > 500

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ todayExpense: 0, monthlyExpense: 0 }),
    );
  });
});
