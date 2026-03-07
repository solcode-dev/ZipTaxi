import { useCallback } from 'react';
import { firebaseDb, firebaseAuth, Timestamp } from '../lib/firebase';
import { doc, collection, runTransaction } from '@react-native-firebase/firestore';
import { getTodayStr } from '../utils/dateUtils';
import type { RevenueSource } from '../types/models';

/**
 * [수입 쓰기 전용 훅]
 * 수입 추가·삭제 트랜잭션만 담당합니다.
 * 데이터 구독은 useUserDoc이 일괄 처리합니다.
 */
export const useRevenueTracker = () => {
  const addRevenue = useCallback(async (
    amount: number,
    source: RevenueSource,
    note?: string,
  ): Promise<boolean> => {
    const user = firebaseAuth.currentUser;
    if (!user || amount <= 0) return false;

    const userRef = doc(firebaseDb, 'users', user.uid);
    const newRevenueRef = doc(collection(userRef, 'revenues'));
    const todayStr = getTodayStr();

    try {
      await runTransaction(firebaseDb, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw '사용자가 존재하지 않습니다!';

        const data = userDoc.data() || {};
        const lastDate = data.lastRevenueDate || '';
        const lastMonth = lastDate.slice(0, 7);
        const thisMonth = todayStr.slice(0, 7);

        const todayRevenue = lastDate !== todayStr ? 0 : (data.todayRevenue || 0);
        const monthlyRevenue = (lastMonth && lastMonth !== thisMonth) ? 0 : (data.monthlyRevenue || 0);

        transaction.set(newRevenueRef, {
          amount,
          source,
          note: note || '',
          timestamp: Timestamp.fromDate(new Date()),
          dateStr: todayStr,
        });

        transaction.update(userRef, {
          totalRevenue: (data.totalRevenue || 0) + amount,
          todayRevenue: todayRevenue + amount,
          monthlyRevenue: monthlyRevenue + amount,
          lastRevenueDate: todayStr,
        });
      });

      return true;
    } catch (e) {
      console.error('수입 저장 실패:', e);
      return false;
    }
  }, []);

  const deleteRevenue = useCallback(async (
    revenueId: string,
    amount: number,
    dateStr: string,
  ): Promise<boolean> => {
    const user = firebaseAuth.currentUser;
    if (!user) return false;

    const userRef = doc(firebaseDb, 'users', user.uid);
    const revenueDocRef = doc(firebaseDb, 'users', user.uid, 'revenues', revenueId);
    const todayStr = getTodayStr();

    try {
      await runTransaction(firebaseDb, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw '사용자가 존재하지 않습니다!';

        const data = userDoc.data() || {};
        const newToday = dateStr === todayStr
          ? Math.max(0, (data.todayRevenue || 0) - amount)
          : (data.todayRevenue || 0);

        transaction.delete(revenueDocRef);
        transaction.update(userRef, {
          totalRevenue: Math.max(0, (data.totalRevenue || 0) - amount),
          monthlyRevenue: Math.max(0, (data.monthlyRevenue || 0) - amount),
          todayRevenue: newToday,
        });
      });

      return true;
    } catch (e) {
      console.error('수입 삭제 실패:', e);
      return false;
    }
  }, []);

  return { addRevenue, deleteRevenue };
};
