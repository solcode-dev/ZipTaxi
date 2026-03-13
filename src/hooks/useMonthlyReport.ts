import { useState, useEffect } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';
import { getMonthRange } from '../utils/dateUtils';
import type { RevenueSource } from '../types/models';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MonthlyReportData {
  // 수입
  total: number;
  workingDays: number;
  dailyAvg: number;
  bySource: Record<RevenueSource, number>;
  /** 0=일, 1=월, ..., 6=토 */
  byDayOfWeek: number[];
  /** 0=새벽(0-5시), 1=오전(6-11시), 2=오후(12-17시), 3=야간(18-23시) */
  byTimeSlot: number[];
  // 지출 & 순이익
  expense: number;
  netProfit: number;
  // 인사이트
  bestDayOfWeek: number | null;
  bestTimeSlot: number | null;
  bestDay: { dateStr: string; amount: number } | null;
  // 캘린더 히트맵
  dailyRevenue: Record<string, number>;
}

const EMPTY: MonthlyReportData = {
  total: 0,
  workingDays: 0,
  dailyAvg: 0,
  bySource: { kakao: 0, card: 0, cash: 0, other: 0 },
  byDayOfWeek: [0, 0, 0, 0, 0, 0, 0],
  byTimeSlot: [0, 0, 0, 0],
  expense: 0,
  netProfit: 0,
  bestDayOfWeek: null,
  bestTimeSlot: null,
  bestDay: null,
  dailyRevenue: {},
};

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchMonthData(uid: string, date: Date): Promise<MonthlyReportData> {
  const { startStr, endStr } = getMonthRange(date);
  const userRef = firebaseDb.collection('users').doc(uid);

  const [revenueSnap, expenseSnap] = await Promise.all([
    userRef.collection('revenues')
      .where('dateStr', '>=', startStr)
      .where('dateStr', '<=', endStr)
      .get(),
    userRef.collection('expenses')
      .where('dateStr', '>=', startStr)
      .where('dateStr', '<=', endStr)
      .get(),
  ]);

  const bySource: Record<RevenueSource, number> = { kakao: 0, card: 0, cash: 0, other: 0 };
  const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  const byTimeSlot  = [0, 0, 0, 0];
  const dailyRevenue: Record<string, number> = {};
  const workingDaySet = new Set<string>();
  let total = 0;

  revenueSnap.docs.forEach(doc => {
    const data = doc.data();
    const amount = (data.amount as number) ?? 0;
    const source = (data.source as RevenueSource) ?? 'other';

    total += amount;
    bySource[source] += amount;

    if (data.dateStr) {
      const dateStr = data.dateStr as string;
      workingDaySet.add(dateStr);
      dailyRevenue[dateStr] = (dailyRevenue[dateStr] ?? 0) + amount;
      byDayOfWeek[new Date(dateStr + 'T00:00:00').getDay()] += amount;
    }

    if (data.timestamp) {
      const hour = (data.timestamp.toDate() as Date).getHours();
      byTimeSlot[hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3] += amount;
    }
  });

  let expense = 0;
  expenseSnap.docs.forEach(doc => {
    expense += (doc.data().amount as number) ?? 0;
  });

  const maxDow  = Math.max(...byDayOfWeek);
  const maxSlot = Math.max(...byTimeSlot);
  const bestDay = Object.entries(dailyRevenue).reduce<{ dateStr: string; amount: number } | null>(
    (best, [dateStr, amount]) =>
      !best || amount > best.amount ? { dateStr, amount } : best,
    null,
  );

  const workingDays = workingDaySet.size;
  return {
    total,
    workingDays,
    dailyAvg: workingDays > 0 ? Math.round(total / workingDays) : 0,
    bySource,
    byDayOfWeek,
    byTimeSlot,
    expense,
    netProfit: total - expense,
    bestDayOfWeek: maxDow  > 0 ? byDayOfWeek.indexOf(maxDow)  : null,
    bestTimeSlot:  maxSlot > 0 ? byTimeSlot.indexOf(maxSlot)  : null,
    bestDay,
    dailyRevenue,
  };
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMonthlyReport(date: Date) {
  const [current,     setCurrent]     = useState<MonthlyReportData>(EMPTY);
  const [previous,    setPrevious]    = useState<MonthlyReportData>(EMPTY);
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const monthKey = toMonthKey(date);

  useEffect(() => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);

    Promise.all([
      fetchMonthData(uid, date),
      fetchMonthData(uid, prevDate),
      firebaseDb.collection('users').doc(uid).get(),
    ]).then(([curr, prev, userSnap]) => {
      if (cancelled) return;
      setCurrent(curr);
      setPrevious(prev);
      setMonthlyGoal((userSnap.data()?.monthlyGoal as number) ?? 0);
      setLoading(false);
    }).catch(err => {
      if (cancelled) return;
      console.error('월간 리포트 조회 실패:', err);
      setError('데이터를 불러오지 못했습니다.');
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [monthKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { current, previous, monthlyGoal, loading, error };
}
