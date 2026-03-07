import { useCallback } from 'react';
import { firebaseDb, firebaseAuth, Timestamp } from '../lib/firebase';
import { doc, collection, runTransaction } from '@react-native-firebase/firestore';
import { getTodayStr } from '../utils/dateUtils';
import type { ExpenseCategory } from '../types/models';

/**
 * [지출 쓰기 전용 훅]
 * 지출 추가·삭제 트랜잭션만 담당합니다.
 * 데이터 구독은 useUserDoc이 일괄 처리합니다.
 */
export const useExpenseTracker = () => {
  const addExpense = useCallback(async (
    amount: number,
    category: ExpenseCategory,
    note?: string,
  ): Promise<boolean> => {
    const user = firebaseAuth.currentUser;
    if (!user || amount <= 0) return false;

    const userRef = doc(firebaseDb, 'users', user.uid);
    const newExpenseRef = doc(collection(userRef, 'expenses'));
    const todayStr = getTodayStr();

    try {
      await runTransaction(firebaseDb, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw '사용자가 존재하지 않습니다!';

        const data = userDoc.data() || {};
        const lastDate = data.lastExpenseDate || '';
        const lastMonth = lastDate.slice(0, 7);
        const thisMonth = todayStr.slice(0, 7);

        const todayExpense = lastDate !== todayStr ? 0 : (data.todayExpense || 0);
        const monthlyExpense = (lastMonth && lastMonth !== thisMonth) ? 0 : (data.monthlyExpense || 0);

        transaction.set(newExpenseRef, {
          amount,
          category,
          note: note || '',
          timestamp: Timestamp.fromDate(new Date()),
          dateStr: todayStr,
        });

        transaction.update(userRef, {
          todayExpense: todayExpense + amount,
          monthlyExpense: monthlyExpense + amount,
          lastExpenseDate: todayStr,
        });
      });

      return true;
    } catch (e) {
      console.error('지출 저장 실패:', e);
      return false;
    }
  }, []);

  const deleteExpense = useCallback(async (
    id: string,
    amount: number,
    dateStr: string,
  ): Promise<boolean> => {
    const user = firebaseAuth.currentUser;
    if (!user) return false;

    const userRef = doc(firebaseDb, 'users', user.uid);
    const expenseDocRef = doc(firebaseDb, 'users', user.uid, 'expenses', id);
    const todayStr = getTodayStr();

    try {
      await runTransaction(firebaseDb, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw '사용자가 존재하지 않습니다!';

        const data = userDoc.data() || {};
        const newToday = dateStr === todayStr
          ? Math.max(0, (data.todayExpense || 0) - amount)
          : (data.todayExpense || 0);

        transaction.delete(expenseDocRef);
        transaction.update(userRef, {
          todayExpense: newToday,
          monthlyExpense: Math.max(0, (data.monthlyExpense || 0) - amount),
        });
      });

      return true;
    } catch (e) {
      console.error('지출 삭제 실패:', e);
      return false;
    }
  }, []);

  return { addExpense, deleteExpense };
};
