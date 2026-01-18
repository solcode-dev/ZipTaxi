import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface StreakData {
  currentStreak: number;
  maxStreak: number;
  freezeCount: number;
  lastGoalDate: string | null; // YYYY-MM-DD format
}

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

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore().collection('users').doc(user.uid)
      .onSnapshot(doc => {
        const data = doc.data();
        if (data) {
          setStreakData({
            currentStreak: data.currentStreak || 0,
            maxStreak: data.maxStreak || 0,
            freezeCount: data.freezeCount || 0,
            lastGoalDate: data.lastGoalDate || null,
          });
          
          checkStreakUpdate(user.uid, data, todayRevenue, dailyTarget);
        }
      });

    return () => unsubscribe();
  }, [todayRevenue, dailyTarget]);

  const checkStreakUpdate = async (
    uid: string, 
    data: any, 
    revenue: number, 
    target: number
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalized to midnight
    const todayStr = today.toISOString().split('T')[0];
    
    // 1. 이미 오늘 달성 기록이 있는지 확인 (중복 업데이트 방지)
    if (data.lastGoalDate === todayStr) return;

    // 2. 오늘 목표 달성 여부 확인
    if (revenue >= target && target > 0) {
      // 마지막 달성일 가져오기
      let lastDate = data.lastGoalDate ? new Date(data.lastGoalDate) : null;
      if (lastDate) lastDate.setHours(0, 0, 0, 0);

      let newStreak = 1;
      let freezeConsumed = 0;

      if (lastDate) {
        // 날짜 차이 계산 (일수)
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
          // 어제 달성함 -> 연속 성공
          newStreak = (data.currentStreak || 0) + 1;
        } else if (diffDays > 1) {
          // 며칠 빼먹음 (diffDays - 1 만큼 결석)
          const missedDays = diffDays - 1;
          const currentFreeze = data.freezeCount || 0;

          if (currentFreeze >= missedDays) {
            // 휴무권으로 방어 성공!
            newStreak = (data.currentStreak || 0) + 1; // 스트릭 유지 및 증가
            freezeConsumed = missedDays;
          } else {
            // 휴무권 부족 -> 리셋 (하지만 오늘 성공했으니 1일)
            newStreak = 1;
          }
        }
      } else {
        // 기록 없음 (첫 달성)
        newStreak = 1;
      }

      // Firestore 업데이트
      const updatePayload: any = {
        currentStreak: newStreak,
        maxStreak: Math.max(data.maxStreak || 0, newStreak),
        lastGoalDate: todayStr
      };

      if (freezeConsumed > 0) {
        updatePayload.freezeCount = (data.freezeCount || 0) - freezeConsumed;
        // TODO: 사용자에게 "휴무권 N개 사용됨" 알림을 띄우면 좋음 (여기선 로직만 처리)
      }

      await firestore().collection('users').doc(uid).update(updatePayload);
    }
  };

  return streakData;
};
