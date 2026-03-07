import { useCallback } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';
import { doc, runTransaction } from '@react-native-firebase/firestore';
import { getTodayStr } from '../utils/dateUtils';

/**
 * [운행 기록 쓰기 전용 훅]
 * 운행 시간·거리 추가 트랜잭션만 담당합니다.
 * 데이터 구독은 useUserDoc이 일괄 처리합니다.
 */
export const useDrivingStats = () => {
  const addDrivingSession = useCallback(async (
    minutes: number,
    distanceKm: number,
  ): Promise<boolean> => {
    const user = firebaseAuth.currentUser;
    if (!user || (minutes <= 0 && distanceKm <= 0)) return false;

    const userRef = doc(firebaseDb, 'users', user.uid);
    const todayStr = getTodayStr();

    try {
      await runTransaction(firebaseDb, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw '사용자가 존재하지 않습니다!';

        const data = userDoc.data() || {};
        const lastMonth = (data.lastDrivingDate || '').slice(0, 7);
        const thisMonth = todayStr.slice(0, 7);
        const isNewMonth = lastMonth !== thisMonth;

        const currentMinutes = isNewMonth ? 0 : (data.monthlyDrivingMinutes || 0);
        const currentDistance = isNewMonth ? 0 : (data.monthlyDistanceKm || 0);

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
  }, []);

  return { addDrivingSession };
};
