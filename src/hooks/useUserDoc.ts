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
  /** 이번 달 사용자가 설정한 근무일 배열 (일 번호, 없으면 빈 배열) */
  currentMonthWorkDays: number[];
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
  currentMonthWorkDays: [],
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

    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      const d = snapshot.data();
      if (!d) {
        // 소셜 로그인 등으로 문서가 없는 경우 초기 문서 생성
        setDoc(userDocRef, {
          name: user.displayName || '기사님',
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
        return;
      }

      const now = new Date();
      const thisMonthKey = getYearMonth(now.getFullYear(), now.getMonth() + 1);
      const thisMonth = getTodayStr().slice(0, 7);
      const resets: Record<string, number> = {};

      const revenueMonth = (d.lastRevenueDate || '').slice(0, 7);
      if (revenueMonth && revenueMonth !== thisMonth && d.monthlyRevenue) {
        resets.monthlyRevenue = 0;
      }

      const expenseMonth = (d.lastExpenseDate || '').slice(0, 7);
      if (expenseMonth && expenseMonth !== thisMonth && d.monthlyExpense) {
        resets.monthlyExpense = 0;
      }

      const drivingMonth = (d.lastDrivingDate || '').slice(0, 7);
      if (drivingMonth && drivingMonth !== thisMonth &&
          (d.monthlyDrivingMinutes || d.monthlyDistanceKm)) {
        resets.monthlyDrivingMinutes = 0;
        resets.monthlyDistanceKm = 0;
      }

      if (Object.keys(resets).length > 0) {
        updateDoc(userDocRef, resets);
        return;
      }

      const todayStr = getTodayStr();
      const workSchedule: Record<string, number[]> = d.workSchedule ?? {};
      setState({
        userName: d.name || '기사님',
        monthlyGoal: d.monthlyGoal || 0,
        totalRevenue: d.totalRevenue || 0,
        todayRevenue: d.lastRevenueDate === todayStr ? (d.todayRevenue || 0) : 0,
        monthlyRevenue: d.monthlyRevenue || 0,
        monthlyExpense: d.monthlyExpense || 0,
        todayExpense: d.lastExpenseDate === todayStr ? (d.todayExpense || 0) : 0,
        monthlyDrivingMinutes: d.monthlyDrivingMinutes || 0,
        monthlyDistanceKm: d.monthlyDistanceKm || 0,
        currentMonthWorkDays: workSchedule[thisMonthKey] ?? [],
      });
    });

    return () => unsubscribe();
  }, []);

  return state;
};
