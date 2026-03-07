import { useState, useEffect } from 'react';
import { firebaseDb, firebaseAuth, Timestamp } from '../lib/firebase';
import { doc, collection, runTransaction, onSnapshot, updateDoc } from '@react-native-firebase/firestore';
import { getTodayStr } from '../utils/dateUtils';
import type { ExpenseCategory } from '../types/models';

export interface ExpenseData {
  monthlyExpense: number;
  todayExpense: number;
}

export const useExpenseTracker = () => {
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    monthlyExpense: 0,
    todayExpense: 0,
  });

  const user = firebaseAuth.currentUser;
  const db = firebaseDb;

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      const data = docSnapshot.data();
      if (data) {
        const thisMonth = getTodayStr().slice(0, 7);
        const lastMonth = (data.lastExpenseDate || '').slice(0, 7);

        if (lastMonth && lastMonth !== thisMonth && data.monthlyExpense !== 0) {
          updateDoc(userDocRef, { monthlyExpense: 0 });
          return;
        }

        setExpenseData({
          monthlyExpense: data.monthlyExpense || 0,
          todayExpense: data.todayExpense || 0,
        });
      }
    });

    return () => unsubscribe();
  }, [user, db]);

  const addExpense = async (amount: number, category: ExpenseCategory, note?: string) => {
    if (!user) return false;
    if (amount <= 0) return false;

    const userRef = doc(db, 'users', user.uid);
    const expensesRef = collection(userRef, 'expenses');
    const newExpenseRef = doc(expensesRef);

    const now = new Date();
    const todayStr = getTodayStr();

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw '사용자가 존재하지 않습니다!';
        }

        const userData = userDoc.data() || {};

        const lastDate = userData.lastExpenseDate || '';
        const lastMonth = lastDate.slice(0, 7);
        const thisMonth = todayStr.slice(0, 7);

        let currentTodayExpense = userData.todayExpense || 0;
        if (lastDate !== todayStr) {
          currentTodayExpense = 0;
        }

        let currentMonthlyExpense = userData.monthlyExpense || 0;
        if (lastMonth && lastMonth !== thisMonth) {
          currentMonthlyExpense = 0;
        }

        const newToday = currentTodayExpense + amount;
        const newMonthly = currentMonthlyExpense + amount;

        transaction.set(newExpenseRef, {
          amount,
          category,
          note: note || '',
          timestamp: Timestamp.fromDate(now),
          dateStr: todayStr,
        });

        transaction.update(userRef, {
          todayExpense: newToday,
          monthlyExpense: newMonthly,
          lastExpenseDate: todayStr,
        });
      });

      return true;
    } catch (e) {
      console.error('지출 저장 실패: ', e);
      return false;
    }
  };

  const deleteExpense = async (id: string, amount: number, dateStr: string) => {
    if (!user) return false;

    const userRef = doc(db, 'users', user.uid);
    const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);
    const todayStr = getTodayStr();

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw '사용자가 존재하지 않습니다!';

        const userData = userDoc.data() || {};

        const currentMonthly = userData.monthlyExpense || 0;
        let currentToday = userData.todayExpense || 0;

        if (dateStr === todayStr) {
          currentToday = Math.max(0, currentToday - amount);
        }

        const newMonthly = Math.max(0, currentMonthly - amount);

        transaction.delete(expenseDocRef);
        transaction.update(userRef, {
          todayExpense: currentToday,
          monthlyExpense: newMonthly,
        });
      });

      return true;
    } catch (e) {
      console.error('지출 삭제 실패:', e);
      return false;
    }
  };

  return {
    ...expenseData,
    addExpense,
    deleteExpense,
  };
};
