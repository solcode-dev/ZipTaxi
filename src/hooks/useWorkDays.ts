import { useState, useMemo, useCallback } from 'react';
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { doc, updateDoc } from '@react-native-firebase/firestore';
import {
  getYearMonth,
  getWeekdayDays,
  getSixDayDays,
  getAllDays,
} from '../utils/calendarUtils';

export type WorkDayPreset = 'weekday' | 'sixDay' | 'allDay' | 'custom';

export interface UseWorkDaysReturn {
  selectedDays: Set<number>;
  preset: WorkDayPreset;
  toggleDay: (day: number) => void;
  applyPreset: (preset: Exclude<WorkDayPreset, 'custom'>) => void;
  save: () => Promise<void>;
  workDayCount: number;
  remainingWorkDays: number;
}

/**
 * 특정 연월의 근무일 Set을 관리하고 Firestore에 저장하는 Hook.
 * workSchedule.YYYY-MM 필드를 dot-notation으로 업데이트합니다.
 */
export const useWorkDays = (
  year: number,
  month: number,
  initialDays?: number[],
): UseWorkDaysReturn => {
  const weekdayDays = useMemo(() => getWeekdayDays(year, month), [year, month]);
  const sixDayDays  = useMemo(() => getSixDayDays(year, month),  [year, month]);
  const allDays     = useMemo(() => getAllDays(year, month),      [year, month]);

  const [selectedDays, setSelectedDays] = useState<Set<number>>(
    () => new Set(initialDays ?? weekdayDays),
  );

  const setsEqual = (s: Set<number>, arr: number[]) =>
    s.size === arr.length && arr.every(d => s.has(d));

  const preset = useMemo<WorkDayPreset>(() => {
    if (setsEqual(selectedDays, weekdayDays)) return 'weekday';
    if (setsEqual(selectedDays, sixDayDays))  return 'sixDay';
    if (setsEqual(selectedDays, allDays))     return 'allDay';
    return 'custom';
  }, [selectedDays, weekdayDays, sixDayDays, allDays]);

  const toggleDay = useCallback((day: number) => {
    setSelectedDays(prev => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  }, []);

  const applyPreset = useCallback(
    (p: Exclude<WorkDayPreset, 'custom'>) => {
      const map = { weekday: weekdayDays, sixDay: sixDayDays, allDay: allDays };
      setSelectedDays(new Set(map[p]));
    },
    [weekdayDays, sixDayDays, allDays],
  );

  const save = useCallback(async () => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');
    const userRef = doc(firebaseDb, 'users', user.uid);
    const sortedDays = Array.from(selectedDays).sort((a, b) => a - b);
    await updateDoc(userRef, {
      [`workSchedule.${getYearMonth(year, month)}`]: sortedDays,
    });
  }, [selectedDays, year, month]);

  const today = new Date();
  const todayDate =
    year === today.getFullYear() && month === today.getMonth() + 1
      ? today.getDate()
      : 1;

  const remainingWorkDays = useMemo(
    () => Array.from(selectedDays).filter(d => d >= todayDate).length,
    [selectedDays, todayDate],
  );

  return {
    selectedDays,
    preset,
    toggleDay,
    applyPreset,
    save,
    workDayCount: selectedDays.size,
    remainingWorkDays,
  };
};
