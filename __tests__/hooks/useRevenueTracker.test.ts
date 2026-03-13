import { renderHook } from '../helpers/renderHook';
import { useRevenueTracker } from '../../src/hooks/useRevenueTracker';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUpdate = jest.fn();
const mockSet    = jest.fn();
const mockDelete = jest.fn();
const mockGet    = jest.fn();
const mockUserRef = {};
const mockRevenueRef = {};

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
  totalRevenue: 100000,
  todayRevenue: 10000,
  monthlyRevenue: 50000,
  lastRevenueDate: '2026-03-13',
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ exists: true, data: () => baseUserData() });
  // doc mock: 첫 번째 호출은 userRef, 두 번째는 revenueRef
  const { doc } = require('@react-native-firebase/firestore');
  doc.mockImplementation((_db: unknown, ...args: string[]) => {
    if (args.join('/').includes('revenues')) return mockRevenueRef;
    return mockUserRef;
  });
});

// ─── addRevenue ───────────────────────────────────────────────────────────────

describe('addRevenue — 입력 유효성 검사', () => {
  test('amount가 0이면 false 반환', async () => {
    const { result } = renderHook(() => useRevenueTracker());
    expect(await result.current.addRevenue(0, 'cash')).toBe(false);
  });

  test('amount가 음수이면 false 반환', async () => {
    const { result } = renderHook(() => useRevenueTracker());
    expect(await result.current.addRevenue(-1000, 'cash')).toBe(false);
  });
});

describe('addRevenue — 트랜잭션 성공', () => {
  test('저장 성공 시 true 반환', async () => {
    const { result } = renderHook(() => useRevenueTracker());
    expect(await result.current.addRevenue(5000, 'kakao')).toBe(true);
  });

  test('totalRevenue, todayRevenue, monthlyRevenue 누적', async () => {
    const { result } = renderHook(() => useRevenueTracker());
    await result.current.addRevenue(5000, 'card');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({
        totalRevenue:   105000, // 100000 + 5000
        todayRevenue:   15000,  // 10000 + 5000
        monthlyRevenue: 55000,  // 50000 + 5000
      }),
    );
  });

  test('날짜가 다르면 todayRevenue를 0에서 시작', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseUserData(), lastRevenueDate: '2026-03-12' }),
    });

    const { result } = renderHook(() => useRevenueTracker());
    await result.current.addRevenue(3000, 'cash');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ todayRevenue: 3000 }),
    );
  });

  test('다른 달이면 monthlyRevenue를 0에서 시작', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseUserData(), lastRevenueDate: '2026-02-28' }),
    });

    const { result } = renderHook(() => useRevenueTracker());
    await result.current.addRevenue(7000, 'kakao');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ monthlyRevenue: 7000 }),
    );
  });

  test('수익 서브컬렉션에 문서 생성', async () => {
    const { result } = renderHook(() => useRevenueTracker());
    await result.current.addRevenue(5000, 'cash', '메모');

    expect(mockSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ amount: 5000, source: 'cash', note: '메모' }),
    );
  });
});

describe('addRevenue — 트랜잭션 실패', () => {
  test('사용자 문서 없으면 false 반환', async () => {
    mockGet.mockResolvedValue({ exists: false });
    const { result } = renderHook(() => useRevenueTracker());
    expect(await result.current.addRevenue(5000, 'cash')).toBe(false);
  });
});

// ─── deleteRevenue ────────────────────────────────────────────────────────────

describe('deleteRevenue — 트랜잭션 성공', () => {
  test('삭제 성공 시 true 반환', async () => {
    const { result } = renderHook(() => useRevenueTracker());
    expect(await result.current.deleteRevenue('rev1', 5000, '2026-03-13')).toBe(true);
  });

  test('오늘 날짜 수익 삭제 시 todayRevenue 차감', async () => {
    const { result } = renderHook(() => useRevenueTracker());
    await result.current.deleteRevenue('rev1', 5000, '2026-03-13');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ todayRevenue: 5000 }), // 10000 - 5000
    );
  });

  test('과거 날짜 수익 삭제 시 todayRevenue 유지', async () => {
    const { result } = renderHook(() => useRevenueTracker());
    await result.current.deleteRevenue('rev1', 5000, '2026-03-10');

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ todayRevenue: 10000 }), // 변경 없음
    );
  });

  test('삭제 후 음수 방지 (Math.max 적용)', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseUserData(), totalRevenue: 1000, monthlyRevenue: 1000 }),
    });

    const { result } = renderHook(() => useRevenueTracker());
    await result.current.deleteRevenue('rev1', 5000, '2026-03-13'); // 5000 > 1000

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ totalRevenue: 0, monthlyRevenue: 0 }),
    );
  });
});
