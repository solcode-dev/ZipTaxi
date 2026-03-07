import { useState, useCallback, useRef } from 'react';
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { collection, query, where, getDocs, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { toDateStr, getMondayOfWeek, getMonthRange, WEEKDAYS } from '../utils/dateUtils';
import type { RevenueSource } from '../types/models';
import {
  analyzeWeeklyPattern,
  analyzeMonthlyPattern,
  type DailyRevenue,
  type WeeklyAnalysisInput,
  type MonthlyAnalysisInput,
} from '../ai/openaiService';

type RawDoc = { dateStr: string; amount: number; source: RevenueSource };

const emptyBySource = (): Record<RevenueSource, number> => ({
  kakao: 0, card: 0, cash: 0, other: 0,
});

function toDailyMap(docs: RawDoc[]): Record<string, DailyRevenue> {
  const map: Record<string, DailyRevenue> = {};
  docs.forEach(({ dateStr, amount, source }) => {
    if (!map[dateStr]) {
      map[dateStr] = {
        dateStr,
        dayLabel: WEEKDAYS[new Date(dateStr).getDay()],
        total: 0,
        bySource: emptyBySource(),
      };
    }
    map[dateStr].total += amount;
    map[dateStr].bySource[source] += amount;
  });
  return map;
}

interface UseRevenueAnalysisOptions {
  monthlyGoal: number;
  remainingDays: number;
}

export const useRevenueAnalysis = ({
  monthlyGoal,
  remainingDays,
}: UseRevenueAnalysisOptions) => {
  const [weeklyAdvice, setWeeklyAdvice] = useState('');
  const [monthlyAdvice, setMonthlyAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const analyze = useCallback(
    async (type: 'weekly' | 'monthly') => {
      if (isLoadingRef.current) return;
      const user = firebaseAuth.currentUser;
      if (!user) return;

      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const revenueRef = collection(firebaseDb, 'users', user.uid, 'revenues');

        if (type === 'weekly') {
          const monday = getMondayOfWeek();
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);

          const snapshot = await getDocs(query(
            revenueRef,
            where('dateStr', '>=', toDateStr(monday)),
            where('dateStr', '<=', toDateStr(sunday)),
          ));
          const rawDocs = snapshot.docs.map(
            (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => d.data() as RawDoc,
          );
          const dailyMap = toDailyMap(rawDocs);

          // 월~일 7일 고정 배열 (수입 없는 날도 포함)
          const days: DailyRevenue[] = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = toDateStr(d);
            return dailyMap[dateStr] ?? {
              dateStr,
              dayLabel: WEEKDAYS[d.getDay()],
              total: 0,
              bySource: emptyBySource(),
            };
          });

          const input: WeeklyAnalysisInput = { days };
          setWeeklyAdvice(await analyzeWeeklyPattern(input));

        } else {
          const today = new Date();
          const { startStr, endStr } = getMonthRange(today);

          const snapshot = await getDocs(query(
            revenueRef,
            where('dateStr', '>=', startStr),
            where('dateStr', '<=', endStr),
          ));
          const rawDocs = snapshot.docs.map(
            (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => d.data() as RawDoc,
          );
          const days = Object.values(toDailyMap(rawDocs));

          const input: MonthlyAnalysisInput = {
            days,
            monthTotal: days.reduce((s, d) => s + d.total, 0),
            monthlyGoal,
            daysElapsed: today.getDate(),
            remainingDays,
          };
          setMonthlyAdvice(await analyzeMonthlyPattern(input));
        }
      } catch (e) {
        console.error('수입 분석 에러:', e);
        setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    },
    [monthlyGoal, remainingDays],
  );

  return { weeklyAdvice, monthlyAdvice, loading, error, analyze };
};
