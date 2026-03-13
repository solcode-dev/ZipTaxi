import { useState, useEffect } from 'react';
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from '@react-native-firebase/firestore';
import { getTodayStr } from '../utils/dateUtils';
import { getYearMonth } from '../utils/calendarUtils';

export interface UserDocState {
  userName: string;
  monthlyGoal: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  monthlyExpense: number;
  todayExpense: number;
  monthlyDrivingMinutes: number;
  monthlyDistanceKm: number;
  /** 오늘 운행 기록 여부 */
  todayDrivingRecorded: boolean;
  /** 이번 달 사용자가 설정한 근무일 배열 (일 번호, 없으면 빈 배열) */
  currentMonthWorkDays: number[];
  /** 전월 스냅샷 (효율 비교용) */
  prevMonthRevenue: number;
  prevMonthExpense: number;
  prevMonthDrivingMinutes: number;
  prevMonthDistanceKm: number;
}

const DEFAULT_STATE: UserDocState = {
  userName: '',
  monthlyGoal: 0,
  totalRevenue: 0,
  todayRevenue: 0,
  monthlyRevenue: 0,
  monthlyExpense: 0,
  todayExpense: 0,
  monthlyDrivingMinutes: 0,
  monthlyDistanceKm: 0,
  todayDrivingRecorded: false,
  currentMonthWorkDays: [],
  prevMonthRevenue: 0,
  prevMonthExpense: 0,
  prevMonthDrivingMinutes: 0,
  prevMonthDistanceKm: 0,
};

/**
 * [사용자 문서 단일 구독 훅]
 * users/{uid} 문서에 리스너를 하나만 연결하여 모든 집계 데이터를 공급합니다.
 * 새 달이 감지되면 각 카테고리별 월간 합계를 한 번의 updateDoc으로 초기화합니다.
 */
export const useUserDoc = (): UserDocState => {
  const [state, setState] = useState<UserDocState>(DEFAULT_STATE);

  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user) return;

    const userDocRef = doc(firebaseDb, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      const d = snapshot.data();
      if (!d) {
        // 소셜 로그인 등으로 문서가 없는 경우 초기 문서 생성
        try {
          await setDoc(userDocRef, {
            name: user.displayName || '사장님',
            email: user.email || '',
            totalRevenue: 0,
            todayRevenue: 0,
            monthlyRevenue: 0,
            monthlyGoal: 0,
            monthlyExpense: 0,
            todayExpense: 0,
            monthlyDrivingMinutes: 0,
            monthlyDistanceKm: 0,
          });
        } catch (e) {
          console.error('사용자 문서 초기화 실패:', e);
        }
        return;
      }

      const now = new Date();
      const thisMonthKey = getYearMonth(now.getFullYear(), now.getMonth() + 1);
      const thisMonth = getTodayStr().slice(0, 7);
      const resets: Record<string, number | string> = {};

      const revenueNeedsReset  = (d.lastRevenueDate  || '').slice(0, 7) !== thisMonth && !!d.monthlyRevenue;
      const expenseNeedsReset  = (d.lastExpenseDate  || '').slice(0, 7) !== thisMonth && !!d.monthlyExpense;
      const drivingNeedsReset  = (d.lastDrivingDate  || '').slice(0, 7) !== thisMonth &&
        !!(d.monthlyDrivingMinutes || d.monthlyDistanceKm);

      // 월 전환 시 현재 데이터를 전월 스냅샷으로 한 번만 저장 (prevMonthKey로 중복 방지)
      if ((revenueNeedsReset || expenseNeedsReset || drivingNeedsReset) &&
          d.prevMonthKey !== thisMonth) {
        resets.prevMonthRevenue         = d.monthlyRevenue         || 0;
        resets.prevMonthExpense         = d.monthlyExpense         || 0;
        resets.prevMonthDrivingMinutes  = d.monthlyDrivingMinutes  || 0;
        resets.prevMonthDistanceKm      = d.monthlyDistanceKm      || 0;
        resets.prevMonthKey             = thisMonth;
      }

      if (revenueNeedsReset) resets.monthlyRevenue = 0;
      if (expenseNeedsReset) resets.monthlyExpense = 0;
      if (drivingNeedsReset) {
        resets.monthlyDrivingMinutes = 0;
        resets.monthlyDistanceKm     = 0;
      }

      if (Object.keys(resets).length > 0) {
        updateDoc(userDocRef, resets).catch((e) =>
          console.error('월간 데이터 리셋 실패:', e),
        );
        return;
      }

      const todayStr = getTodayStr();
      const workSchedule: Record<string, number[]> = d.workSchedule ?? {};
      setState({
        userName: d.name || '사장님',
        monthlyGoal: d.monthlyGoal || 0,
        totalRevenue: d.totalRevenue || 0,
        todayRevenue: d.lastRevenueDate === todayStr ? (d.todayRevenue || 0) : 0,
        monthlyRevenue: d.monthlyRevenue || 0,
        monthlyExpense: d.monthlyExpense || 0,
        todayExpense: d.lastExpenseDate === todayStr ? (d.todayExpense || 0) : 0,
        monthlyDrivingMinutes: d.monthlyDrivingMinutes || 0,
        monthlyDistanceKm: d.monthlyDistanceKm || 0,
        todayDrivingRecorded: d.lastDrivingDate === todayStr,
        currentMonthWorkDays: workSchedule[thisMonthKey] ?? [],
        prevMonthRevenue: d.prevMonthRevenue || 0,
        prevMonthExpense: d.prevMonthExpense || 0,
        prevMonthDrivingMinutes: d.prevMonthDrivingMinutes || 0,
        prevMonthDistanceKm: d.prevMonthDistanceKm || 0,
      });
    }, (e) => {
      console.error('사용자 문서 구독 실패:', e);
    });

    return () => unsubscribe();
  }, []);

  return state;
};
