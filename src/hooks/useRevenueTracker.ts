import { useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { getFirestore, doc, collection, runTransaction, onSnapshot, Timestamp } from '@react-native-firebase/firestore';

export interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

export const useRevenueTracker = () => {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  });

  const user = auth().currentUser;
  const db = getFirestore();

  // Listen to aggregated data
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      const data = docSnapshot.data();
      if (data) {
        // Simple day/month reset logic check could be added here or handled server-side.
        // For Phase 1, we assume data is updated correctly via addRevenue.
        // In a real app, we need to check if 'todayRevenue' belongs to 'today'.
        // We'll implement a basic check in 'addRevenue' and maybe a client-side filter later.
        // For now, trust the User/Firestore data.
        
        setRevenueData({
          totalRevenue: data.totalRevenue || 0,
          todayRevenue: data.todayRevenue || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
        });
      }
    });

    return () => unsubscribe();
  }, [user, db]);

  const addRevenue = async (amount: number, source: 'kakao' | 'card' | 'cash' | 'other', note?: string) => {
    if (!user) return;
    if (amount <= 0) return;

    const userRef = doc(db, 'users', user.uid);
    const revenuesRef = collection(userRef, 'revenues');
    const newRevenueRef = doc(revenuesRef); // Auto-ID

    // Date calculations
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    // const currentMonthStr = todayStr.substring(0, 7); // Unused for now

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw "User does not exist!";
        }

        const userData = userDoc.data() || {};
        
        // Reset Logic Check
        const lastDate = userData.lastRevenueDate || "";
        let currentTodayRevenue = userData.todayRevenue || 0;
        
        if (lastDate !== todayStr) {
          currentTodayRevenue = 0;
        }

        const newTotal = (userData.totalRevenue || 0) + amount;
        const newToday = currentTodayRevenue + amount;
        const newMonthly = (userData.monthlyRevenue || 0) + amount; 

        // 1. Create Revenue Record
        transaction.set(newRevenueRef, {
          amount,
          source,
          note: note || '',
          timestamp: Timestamp.fromDate(now),
          dateStr: todayStr,
        });

        // 2. Update Aggregates
        transaction.update(userRef, {
          totalRevenue: newTotal,
          todayRevenue: newToday,
          monthlyRevenue: newMonthly,
          lastRevenueDate: todayStr, 
        });
      });
      console.log('Revenue Transaction successfully committed!');
      return true;
    } catch (e) {
      console.error('Transaction failed: ', e);
      return false;
    }
  };

  const deleteRevenue = async (revenueId: string, amount: number, dateStr: string) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    // Fix: doc() cannot take a DocumentReference as first argument. 
    // Must use db instance with full path OR get collection ref first.
    const revenueDocRef = doc(db, 'users', user.uid, 'revenues', revenueId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
      await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw "User does not exist!";
          
          const userData = userDoc.data() || {};

          // Calculation for rollback
          const currentTotal = userData.totalRevenue || 0;
          const currentMonthly = userData.monthlyRevenue || 0;
          let currentToday = userData.todayRevenue || 0;

          // Only deduct from todayRevenue if the deleted item is from Today
          if (dateStr === todayStr) {
              currentToday = Math.max(0, currentToday - amount);
          }

          const newTotal = Math.max(0, currentTotal - amount);
          const newMonthly = Math.max(0, currentMonthly - amount);

          // 1. Delete Record
          // console.log(`[Transaction] Scheduling delete for revenueId: ${revenueId}`);
          transaction.delete(revenueDocRef);

          // 2. Update Aggregates
          // console.log(`[Transaction] Scheduling update for userRef with new totals:`, { newTotal, newMonthly, currentToday });
          transaction.update(userRef, {
              totalRevenue: newTotal,
              monthlyRevenue: newMonthly,
              todayRevenue: currentToday
          });
      });
      // console.log('[Transaction] Delete transaction successfully committed!');
      return true;
    } catch (e) {
        console.error('Delete Transaction failed:', e);
        return false;
    }
  };

  return {
    ...revenueData,
    addRevenue,
    deleteRevenue,
  };
};
