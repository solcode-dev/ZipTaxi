import { useState, useEffect } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';
import { doc, runTransaction, onSnapshot, updateDoc } from '@react-native-firebase/firestore';
import { getTodayStr } from '../utils/dateUtils';

export interface DrivingStatsData {
  monthlyDrivingMinutes: number;
  monthlyDistanceKm: number;
}

export const useDrivingStats = () => {
  const [drivingStats, setDrivingStats] = useState<DrivingStatsData>({
    monthlyDrivingMinutes: 0,
    monthlyDistanceKm: 0,
  });

  const user = firebaseAuth.currentUser;
  const db = firebaseDb;

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      const data = docSnapshot.data();
      if (!data) return;

      const thisMonth = getTodayStr().slice(0, 7);
      const lastMonth = (data.lastDrivingDate || '').slice(0, 7);

      if (lastMonth && lastMonth !== thisMonth &&
          (data.monthlyDrivingMinutes !== 0 || data.monthlyDistanceKm !== 0)) {
        updateDoc(userDocRef, { monthlyDrivingMinutes: 0, monthlyDistanceKm: 0 });
        return;
      }

      setDrivingStats({
        monthlyDrivingMinutes: data.monthlyDrivingMinutes || 0,
        monthlyDistanceKm: data.monthlyDistanceKm || 0,
      });
    });

    return () => unsubscribe();
  }, [user, db]);

  const addDrivingSession = async (minutes: number, distanceKm: number) => {
    if (!user) return false;
    if (minutes <= 0 && distanceKm <= 0) return false;

    const userRef = doc(db, 'users', user.uid);
    const todayStr = getTodayStr();

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw '사용자가 존재하지 않습니다!';

        const userData = userDoc.data() || {};
        const lastMonth = (userData.lastDrivingDate || '').slice(0, 7);
        const thisMonth = todayStr.slice(0, 7);

        const isNewMonth = lastMonth !== thisMonth;
        const currentMinutes = isNewMonth ? 0 : (userData.monthlyDrivingMinutes || 0);
        const currentDistance = isNewMonth ? 0 : (userData.monthlyDistanceKm || 0);

        transaction.update(userRef, {
          monthlyDrivingMinutes: currentMinutes + minutes,
          monthlyDistanceKm: Math.round((currentDistance + distanceKm) * 10) / 10,
          lastDrivingDate: todayStr,
        });
      });

      return true;
    } catch (e) {
      console.error('운행 기록 저장 실패:', e);
      return false;
    }
  };

  return {
    ...drivingStats,
    addDrivingSession,
  };
};
