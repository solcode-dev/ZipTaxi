import { useState, useEffect } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';
import { getMonthRange } from '../utils/dateUtils';
import type { RevenueSource } from '../types/models';

export interface MonthlyReportData {
  total: number;
  workingDays: number;
  dailyAvg: number;
  bySource: Record<RevenueSource, number>;
  /** 인덱스 0=일, 1=월, ..., 6=토 */
  byDayOfWeek: number[];
  /** 인덱스 0=새벽(0-5시), 1=오전(6-11시), 2=오후(12-17시), 3=야간(18-23시) */
  byTimeSlot: number[];
}

const EMPTY: MonthlyReportData = {
  total: 0,
  workingDays: 0,
  dailyAvg: 0,
  bySource: { kakao: 0, card: 0, cash: 0, other: 0 },
  byDayOfWeek: [0, 0, 0, 0, 0, 0, 0],
  byTimeSlot: [0, 0, 0, 0],
};

async function fetchMonthData(uid: string, date: Date): Promise<MonthlyReportData> {
  const { startStr, endStr } = getMonthRange(date);
  const snap = await firebaseDb
    .collection('users')
    .doc(uid)
    .collection('revenues')
    .where('dateStr', '>=', startStr)
    .where('dateStr', '<=', endStr)
    .get();

  const bySource: Record<RevenueSource, number> = { kakao: 0, card: 0, cash: 0, other: 0 };
  const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  const byTimeSlot  = [0, 0, 0, 0];
  const workingDaySet = new Set<string>();
  let total = 0;

  snap.docs.forEach(doc => {
    const data = doc.data();
    const amount = (data.amount as number) ?? 0;
    const source = (data.source as RevenueSource) ?? 'other';
    total += amount;
    bySource[source] += amount;

    if (data.dateStr) {
      workingDaySet.add(data.dateStr as string);
      const dow = new Date((data.dateStr as string) + 'T00:00:00').getDay();
      byDayOfWeek[dow] += amount;
    }

    if (data.timestamp) {
      const hour = data.timestamp.toDate().getHours();
      const slot = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
      byTimeSlot[slot] += amount;
    }
  });

  const workingDays = workingDaySet.size;
  return {
    total,
    workingDays,
    dailyAvg: workingDays > 0 ? Math.round(total / workingDays) : 0,
    bySource,
    byDayOfWeek,
    byTimeSlot,
  };
}

/** YYYY-MM 형식의 안정적인 키로 월을 식별합니다. */
function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function useMonthlyReport(date: Date) {
  const [current, setCurrent] = useState<MonthlyReportData>(EMPTY);
  const [previous, setPrevious] = useState<MonthlyReportData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthKey = toMonthKey(date);

  useEffect(() => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);

    Promise.all([fetchMonthData(uid, date), fetchMonthData(uid, prevDate)]).then(
      ([curr, prev]) => {
        if (!cancelled) {
          setCurrent(curr);
          setPrevious(prev);
          setLoading(false);
        }
      },
    ).catch((err) => {
      if (!cancelled) {
        console.error('월간 리포트 조회 실패:', err);
        setError('데이터를 불러오지 못했습니다.');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [monthKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { current, previous, loading, error };
}
