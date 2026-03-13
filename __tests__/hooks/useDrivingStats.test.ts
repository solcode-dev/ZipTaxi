import { renderHook } from '../helpers/renderHook';
import { useDrivingStats } from '../../src/hooks/useDrivingStats';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUpdate = jest.fn();
const mockGet    = jest.fn();
const mockUserRef = {};

jest.mock('../../src/lib/firebase', () => ({
  firebaseAuth: { currentUser: { uid: 'test-uid' } },
  firebaseDb: {},
}));

jest.mock('@react-native-firebase/firestore', () => ({
  doc: jest.fn(() => mockUserRef),
  runTransaction: jest.fn(async (_db: unknown, cb: (tx: unknown) => Promise<void>) => cb({
    get: mockGet,
    update: mockUpdate,
  })),
}));

jest.mock('../../src/utils/dateUtils', () => ({
  getTodayStr: jest.fn(() => '2026-03-13'),
}));

// ─── 테스트 ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDrivingStats — 입력 유효성 검사', () => {
  test('분과 거리 모두 0이면 false 반환', async () => {
    const { result } = renderHook(() => useDrivingStats());
    expect(await result.current.addDrivingSession(0, 0)).toBe(false);
  });

  test('분이 음수이고 거리도 0이면 false 반환', async () => {
    const { result } = renderHook(() => useDrivingStats());
    expect(await result.current.addDrivingSession(-1, 0)).toBe(false);
  });
});

describe('useDrivingStats — 트랜잭션 성공', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        monthlyDrivingMinutes: 100,
        monthlyDistanceKm: 50,
        lastDrivingDate: '2026-03-12',
      }),
    });
  });

  test('저장 성공 시 true 반환', async () => {
    const { result } = renderHook(() => useDrivingStats());
    expect(await result.current.addDrivingSession(60, 30)).toBe(true);
  });

  test('같은 달이면 기존 값에 누적', async () => {
    const { result } = renderHook(() => useDrivingStats());
    await result.current.addDrivingSession(60, 30);

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({
        monthlyDrivingMinutes: 160, // 100 + 60
        monthlyDistanceKm: 80,      // 50 + 30
      }),
    );
  });

  test('새 달이면 기존 값을 초기화하고 입력값만 저장', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        monthlyDrivingMinutes: 300,
        monthlyDistanceKm: 120,
        lastDrivingDate: '2026-02-28', // 전월
      }),
    });

    const { result } = renderHook(() => useDrivingStats());
    await result.current.addDrivingSession(60, 30);

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({
        monthlyDrivingMinutes: 60,
        monthlyDistanceKm: 30,
      }),
    );
  });

  test('lastDrivingDate가 오늘 날짜로 업데이트됨', async () => {
    const { result } = renderHook(() => useDrivingStats());
    await result.current.addDrivingSession(30, 10);

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ lastDrivingDate: '2026-03-13' }),
    );
  });

  test('거리는 소수점 1자리 반올림', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ monthlyDistanceKm: 10.15, lastDrivingDate: '2026-03-13' }),
    });

    const { result } = renderHook(() => useDrivingStats());
    await result.current.addDrivingSession(0, 10.18);

    expect(mockUpdate).toHaveBeenCalledWith(
      mockUserRef,
      expect.objectContaining({ monthlyDistanceKm: 20.3 }),
    );
  });
});

describe('useDrivingStats — 트랜잭션 실패', () => {
  test('사용자 문서 없으면 false 반환', async () => {
    mockGet.mockResolvedValue({ exists: false });

    const { result } = renderHook(() => useDrivingStats());
    expect(await result.current.addDrivingSession(60, 30)).toBe(false);
  });

  test('트랜잭션 자체 오류 시 false 반환', async () => {
    const { runTransaction } = require('@react-native-firebase/firestore');
    runTransaction.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useDrivingStats());
    expect(await result.current.addDrivingSession(60, 30)).toBe(false);
  });
});
