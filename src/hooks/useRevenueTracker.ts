import { useState, useEffect } from 'react';
// 중앙 집중식 Firebase 서비스 레이어에서 필요한 인스턴스와 유틸리티를 가져옵니다.
import { firebaseDb, firebaseAuth, Timestamp } from '../lib/firebase';
import { doc, collection, runTransaction, onSnapshot } from '@react-native-firebase/firestore';

export interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

/**
 * [수익 추적 커스텀 훅]
 * 사용자의 총 수입, 오늘 수입, 이번 달 수입을 실시간으로 추적하고
 * 새로운 수입 내역을 추가하거나 삭제하는 기능을 제공합니다.
 */
export const useRevenueTracker = () => {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  });

  // 현재 로그인된 사용자 정보와 Firestore DB 인스턴스를 준비합니다.
  const user = firebaseAuth.currentUser;
  const db = firebaseDb;

  /**
   * [실시간 데이터 구독]
   * 사용자의 문서(Document)를 감시하여 수입 데이터가 변경될 때마다 UI를 업데이트합니다.
   */
  useEffect(() => {
    if (!user) return;

    // 사용자 정보가 담긴 Firestore 문서 참조
    const userDocRef = doc(db, 'users', user.uid);
    
    // 실시간 리스너 연결
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      const data = docSnapshot.data();
      if (data) {
        // Firestore에서 가져온 데이터를 상태값에 저장합니다.
        setRevenueData({
          totalRevenue: data.totalRevenue || 0,
          todayRevenue: data.todayRevenue || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
        });
      }
    });

    // 컴포넌트 언마운트 시 리스너를 해제합니다.
    return () => unsubscribe();
  }, [user, db]);

  /**
   * [수입 내역 추가 함수]
   * 새로운 수입을 기록하고 사용자의 총 합계 데이터를 트랜잭션으로 안전하게 업데이트합니다.
   */
  const addRevenue = async (amount: number, source: 'kakao' | 'card' | 'cash' | 'other', note?: string) => {
    if (!user) return;
    if (amount <= 0) return;

    const userRef = doc(db, 'users', user.uid);
    const revenuesRef = collection(userRef, 'revenues');
    const newRevenueRef = doc(revenuesRef); // 자동 생성될 문서 ID 준비

    // 오늘 날짜 문자열 생성 (YYYY-MM-DD 형식)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
      // 데이터 일관성을 위해 트랜잭션을 사용합니다.
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw "사용자가 존재하지 않습니다!";
        }

        const userData = userDoc.data() || {};
        
        // 날짜가 바뀌었는지 확인하여 오늘 수입(todayRevenue)을 초기화할지 결정합니다.
        const lastDate = userData.lastRevenueDate || "";
        let currentTodayRevenue = userData.todayRevenue || 0;
        
        if (lastDate !== todayStr) {
          currentTodayRevenue = 0;
        }

        // 새로운 합계 금액 계산
        const newTotal = (userData.totalRevenue || 0) + amount;
        const newToday = currentTodayRevenue + amount;
        const newMonthly = (userData.monthlyRevenue || 0) + amount; 

        // 1. 개별 수입 내역(Revenue Record) 생성
        transaction.set(newRevenueRef, {
          amount,
          source,
          note: note || '',
          timestamp: Timestamp.fromDate(now),
          dateStr: todayStr,
        });

        // 2. 사용자의 전체 합계 정보(Aggregates) 업데이트
        transaction.update(userRef, {
          totalRevenue: newTotal,
          todayRevenue: newToday,
          monthlyRevenue: newMonthly,
          lastRevenueDate: todayStr, 
        });
      });
      
      console.log('수입 정보가 성공적으로 저장되었습니다.');
      return true;
    } catch (e) {
      console.error('수입 저장 실패: ', e);
      return false;
    }
  };

  /**
   * [수입 내역 삭제 함수]
   * 기록된 수입을 삭제하고 합계 금액을 롤백(차감)합니다.
   */
  const deleteRevenue = async (revenueId: string, amount: number, dateStr: string) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    // 삭제할 특정 수입 문서 참조
    const revenueDocRef = doc(db, 'users', user.uid, 'revenues', revenueId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
      await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw "사용자가 존재하지 않습니다!";
          
          const userData = userDoc.data() || {};

          // 원래 금액에서 삭제할 금액만큼 차감
          const currentTotal = userData.totalRevenue || 0;
          const currentMonthly = userData.monthlyRevenue || 0;
          let currentToday = userData.todayRevenue || 0;

          // 오늘 발생한 내역인 경우에만 오늘 수입 합계에서 차감합니다.
          if (dateStr === todayStr) {
              currentToday = Math.max(0, currentToday - amount);
          }

          const newTotal = Math.max(0, currentTotal - amount);
          const newMonthly = Math.max(0, currentMonthly - amount);

          // 1. 해당 수입 문서 삭제
          transaction.delete(revenueDocRef);

          // 2. 차감된 합계 정보 업데이트
          transaction.update(userRef, {
              totalRevenue: newTotal,
              monthlyRevenue: newMonthly,
              todayRevenue: currentToday
          });
      });
      
      return true;
    } catch (e) {
        console.error('수입 삭제 실패:', e);
        return false;
    }
  };

  return {
    ...revenueData,
    addRevenue,
    deleteRevenue,
  };
};
