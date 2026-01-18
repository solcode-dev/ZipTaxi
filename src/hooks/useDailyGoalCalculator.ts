import { useMemo } from 'react';

export interface DailyGoalResult {
  dailyTarget: number;        // 오늘 목표 금액
  progressPercent: number;    // 달성률 (100% 초과 가능)
  isBonusMode: boolean;       // 목표 초과 달성 여부 (보너스 모드)
  bonusAmount: number;        // 목표 초과 달성 금액
  remainingDays: number;      // 이번 달 남은 일수
  statusMessage: string;      // 동기 부여 메시지
}

/**
 * 월 목표와 현재 성과를 기반으로 일일 권장 목표를 계산하는 Hook입니다.
 * 가벼운 Native Date 객체를 사용하여 날짜를 계산합니다.
 * 
 * @param monthlyGoal 사용자가 설정한 월 목표 매출
 * @param currentMonthlyRevenue 이번 달 현재까지의 총 매출 
 * @param currentDailyRevenue 오늘 현재까지의 매출 
 */
export const useDailyGoalCalculator = (
  monthlyGoal: number,
  currentMonthlyRevenue: number,
  currentDailyRevenue: number
): DailyGoalResult => {
  
  return useMemo(() => {
    // 1. 날짜 계산
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0부터 시작 (0 = 1월)

    // 이번 달의 마지막 날 구하기
    // new Date(year, month + 1, 0)은 해당 월의 마지막 날을 반환합니다.
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // 오늘을 포함한 잔여 일수 계산
    // 예: 오늘이 31일이고 마지막 날이 31일이면, 남은 일수는 1일입니다.
    const remainingDays = Math.max(1, lastDayOfMonth.getDate() - today.getDate() + 1);

    // 0. 예외 처리: 월 목표가 설정되지 않은 경우 (신규 유저)
    if (monthlyGoal === 0) {
      return {
        dailyTarget: 0,
        progressPercent: 0,
        isBonusMode: false,
        bonusAmount: 0,
        remainingDays,
        statusMessage: "👉 이곳을 눌러 이번 달 목표를 설정해주세요!"
      };
    }

    // 2. 금액 계산
    // 오늘 시작 시점의 매출 계산
    // 'currentMonthlyRevenue'에는 'currentDailyRevenue'가 포함되어 있다고 가정합니다.
    // 우리는 '오늘 0시부터' 얼마를 벌어야 하는지 계산해야 합니다.
    const revenueAtStartOfDay = Math.max(0, currentMonthlyRevenue - currentDailyRevenue);
    
    // 월 목표 달성을 위해 남은 금액
    const targetRemaining = monthlyGoal - revenueAtStartOfDay;

    // 만약 오늘 시작 전에 이미 월 목표를 달성했다면
    if (targetRemaining <= 0) {
      return {
        dailyTarget: 0,
        progressPercent: 100 + (currentDailyRevenue > 0 ? 100 : 0), // 보너스 표시를 위한 임의 퍼센트
        isBonusMode: true,
        bonusAmount: currentDailyRevenue,
        remainingDays,
        statusMessage: "월 목표 달성 완료! 이제부터는 보너스 게임! 🎉"
      };
    }

    // 일일 목표 계산 (깔끔하게 100원 단위로 올림 처리)
    // 남은 금액을 남은 일수로 나누어 할당
    let rawDailyTarget = targetRemaining / remainingDays;
    let dailyTarget = Math.ceil(rawDailyTarget / 100) * 100;

    // 안전 장치: 일일 목표는 음수가 될 수 없음
    dailyTarget = Math.max(0, dailyTarget);

    // 3. 달성률(Progress) 계산
    let progressPercent = 0;
    if (dailyTarget > 0) {
      progressPercent = (currentDailyRevenue / dailyTarget) * 100;
    } else {
      progressPercent = 100; // 논리적으로 보너스 모드에서 처리되지만 안전 장치로 추가
    }

    // 4. 보너스 모드 및 메시지 결정
    const isBonusMode = currentDailyRevenue > dailyTarget;
    const bonusAmount = Math.max(0, currentDailyRevenue - dailyTarget);
    
    let statusMessage = '';
    
    if (isBonusMode) {
      statusMessage = `🔥 오버런! 현재 ${bonusAmount.toLocaleString()}원 추가 수익 중!`;
    } else if (progressPercent >= 100) {
      statusMessage = "오늘 목표 달성! 수고하셨어요 👏";
    } else if (progressPercent >= 50) {
      statusMessage = "절반 넘었어요! 조금만 더 힘내세요 💪";
    } else {
      const remainingForToday = dailyTarget - currentDailyRevenue;
      statusMessage = `오늘 ${remainingForToday.toLocaleString()}원만 더 벌면 목표 달성!`;
    }

    return {
      dailyTarget,
      progressPercent,
      isBonusMode,
      bonusAmount,
      remainingDays,
      statusMessage
    };
  }, [monthlyGoal, currentMonthlyRevenue, currentDailyRevenue]);
};
