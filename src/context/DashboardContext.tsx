import React, { createContext, useContext, useMemo } from 'react';

import { useUserDoc } from '../hooks/useUserDoc';
import { useRevenueTracker } from '../hooks/useRevenueTracker';
import { useExpenseTracker } from '../hooks/useExpenseTracker';
import { useDrivingStats } from '../hooks/useDrivingStats';
import { useDailyGoalCalculator, type DailyGoalResult } from '../hooks/useDailyGoalCalculator';
import { useStreakCalculator } from '../hooks/useStreakCalculator';
import type { RevenueSource, ExpenseCategory } from '../types/models';

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface StreakData {
  currentStreak: number;
  maxStreak: number;
  freezeCount: number;
  lastGoalDate: string | null;
}

export interface DashboardContextValue {
  // 유저 문서 (실시간)
  userName: string;
  monthlyGoal: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  monthlyExpense: number;
  todayExpense: number;
  monthlyDrivingMinutes: number;
  monthlyDistanceKm: number;
  // 파생 계산값
  netProfit: number;
  progressPct: number;
  perHour: number | null;
  perKm: number | null;
  dailyGoalData: DailyGoalResult;
  streakData: StreakData;
  // 액션
  addRevenue: (amount: number, source: RevenueSource) => Promise<boolean>;
  addExpense: (amount: number, category: ExpenseCategory) => Promise<boolean>;
  addDrivingSession: (minutes: number, distanceKm: number) => Promise<boolean>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboard = (): DashboardContextValue => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const userDoc        = useUserDoc();
  const { addRevenue } = useRevenueTracker();
  const { addExpense } = useExpenseTracker();
  const { addDrivingSession } = useDrivingStats();

  const dailyGoalData = useDailyGoalCalculator(
    userDoc.monthlyGoal,
    userDoc.monthlyRevenue,
    userDoc.todayRevenue,
  );
  const streakData = useStreakCalculator(
    userDoc.monthlyGoal,
    userDoc.todayRevenue,
    dailyGoalData.dailyTarget,
  );

  const value = useMemo<DashboardContextValue>(() => {
    const drivingHours = userDoc.monthlyDrivingMinutes / 60;
    const netProfit    = userDoc.monthlyRevenue - userDoc.monthlyExpense;
    return {
      ...userDoc,
      netProfit,
      progressPct: userDoc.monthlyGoal > 0
        ? (userDoc.monthlyRevenue / userDoc.monthlyGoal) * 100
        : 0,
      perHour: drivingHours > 0 ? Math.round(netProfit / drivingHours) : null,
      perKm:   userDoc.monthlyDistanceKm > 0
        ? Math.round(netProfit / userDoc.monthlyDistanceKm)
        : null,
      dailyGoalData,
      streakData,
      addRevenue,
      addExpense,
      addDrivingSession,
    };
  }, [userDoc, dailyGoalData, streakData, addRevenue, addExpense, addDrivingSession]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
