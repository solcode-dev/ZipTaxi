import { useState, useEffect } from 'react';

// 중앙 집중식 Firebase 서비스 레이어에서 필요한 인스턴스를 가져옵니다.
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from '@react-native-firebase/firestore';

interface StreakData {
  currentStreak: number; // 현재 연속 달성 일수
  maxStreak: number; // 역대 최고 연속 달성 일수
  freezeCount: number; // 보유 중인 휴무권(방어권) 개수
  lastGoalDate: string | null; // 마지막으로 목표를 달성한 날짜 (YYYY-MM-DD)
}

/**
 * [연속 달성(Streak) 및 보상 계산 커스텀 훅]
 * 사용자의 운행 목표 달성 여부를 확인하고 연속 기록을 관리합니다.
 * 7일 연속 달성 시 휴무권을 지급하는 보상 시스템을 포함합니다.
 */
export const useStreakCalculator = (
  monthlyGoal: number,
  todayRevenue: number,
  dailyTarget: number
) => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    maxStreak: 0,
    freezeCount: 0,
    lastGoalDate: null,
  });

  /**
   * [사용자 스트릭 데이터 구독]
   * Firestore의 사용자 데이터 변화를 실시간으로 감시하여 스트릭 상태를 업데이트합니다.
   */
  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user) return;

    const userRef = doc(firebaseDb, 'users', user.uid);
    
    // 실시간 리스너 연결
    const unsubscribe = onSnapshot(userRef, (documentSnapshot) => {
      const data = documentSnapshot.data();
      if (data) {
        setStreakData({
          currentStreak: data.currentStreak || 0,
          maxStreak: data.maxStreak || 0,
          freezeCount: data.freezeCount || 0,
          lastGoalDate: data.lastGoalDate || null,
        });
        
        // 데이터 변경 시마다 스트릭 업데이트 여부 확인
        checkStreakUpdate(user.uid, data, todayRevenue, dailyTarget);
      }
    });

    return () => unsubscribe();
  }, [todayRevenue, dailyTarget]);

  /**
   * [스트릭 업데이트 체크 함수]
   * 오늘 목표를 달성했는지, 연속 기록을 갱신해야 하는지 판단합니다.
   */
  const checkStreakUpdate = async (
    uid: string, 
    data: any, 
    revenue: number, 
    target: number
  ) => {
    // 오늘 날짜 문자열 생성 (로그 비교용)
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const todayStr = today.toISOString().split('T')[0];
    
    // 1단계: 이미 오늘 달성 기록이 저장되어 있다면 중복 업데이트 방지
    if (data.lastGoalDate === todayStr) return;

    // 2단계: 오늘 목표 달성 여부 확인 (수입이 타겟보다 크거나 같을 때)
    if (revenue >= target && target > 0) {
      // 마지막 달성일 정보 가져오기
      let lastDate = data.lastGoalDate ? new Date(data.lastGoalDate) : null;
      if (lastDate) lastDate.setHours(0, 0, 0, 0);

      let newStreak = 1;
      let freezeConsumed = 0;

      if (lastDate) {
        // 날짜 차이 계산 (마지막 달성일로부터 며칠이 지났는지)
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
          // 어제 달성함 -> 스트릭 연속 증가
          newStreak = (data.currentStreak || 0) + 1;
        } else if (diffDays > 1) {
          // 며칠 운행을 쉬었음 -> 휴무권 보유 여부 확인
          const missedDays = diffDays - 1;
          const currentFreeze = data.freezeCount || 0;

          if (currentFreeze >= missedDays) {
            // 휴무권으로 공백을 메꾸어 스트릭 유지!
            newStreak = (data.currentStreak || 0) + 1; 
            freezeConsumed = missedDays;
          } else {
            // 휴무권이 부족하여 스트릭이 리셋됨 (오늘부터 다시 1일)
            newStreak = 1;
          }
        }
      } else {
        // 기록이 아예 없는 신규 사용자인 경우
        newStreak = 1;
      }

      // 3단계: 업데이트할 데이터 구성 (Payload)
      const updatePayload: any = {
        currentStreak: newStreak,
        maxStreak: Math.max(data.maxStreak || 0, newStreak),
        lastGoalDate: todayStr
      };

      // 4단계: 보상 시스템 처리 (7일 연속 달성 시마다 휴무권 1개 지급)
      if (newStreak > 0 && newStreak % 7 === 0) {
        const currentFreeze = (data.freezeCount || 0) - freezeConsumed; 
        updatePayload.freezeCount = currentFreeze + 1;
      } else if (freezeConsumed > 0) {
        // 휴무권을 소모한 경우만 차감 업데이트
        updatePayload.freezeCount = (data.freezeCount || 0) - freezeConsumed;
      }

      // 5단계: Firestore 문서 업데이트 실행
      const userRef = doc(firebaseDb, 'users', uid);
      await updateDoc(userRef, updatePayload);
    }
  };

  // 계산된 스트릭 정보를 반환합니다.
  return streakData;
};
