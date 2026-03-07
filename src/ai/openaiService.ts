import functions from '@react-native-firebase/functions';
import type { RevenueSource } from '../types/models';
import { formatCurrency } from '../utils/formatUtils';

// ─── 공유 데이터 타입 ───────────────────────────────────────────────────────

export interface DailyRevenue {
  dateStr: string;
  dayLabel: string;
  total: number;
  bySource: Record<RevenueSource, number>;
}

export interface WeeklyAnalysisInput {
  days: DailyRevenue[];
}

export interface MonthlyAnalysisInput {
  days: DailyRevenue[];
  monthTotal: number;
  monthlyGoal: number;
  daysElapsed: number;
  remainingDays: number;
}

// ─── 요약 텍스트 빌더 (포맷 로직은 클라이언트에 유지) ─────────────────────

export const SOURCE_LABELS: Record<RevenueSource, string> = {
  kakao: '카카오T',
  card: '카드/현금',
  cash: '현금',
  other: '기타',
};

function buildWeeklySummary(data: WeeklyAnalysisInput): string {
  const weekTotal = data.days.reduce((s, d) => s + d.total, 0);
  const dayLines = data.days
    .filter(d => d.total > 0)
    .map(d => {
      const sources = (Object.entries(d.bySource) as [RevenueSource, number][])
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${SOURCE_LABELS[k]} ${formatCurrency(v)}원`)
        .join(', ');
      return `- ${d.dayLabel}요일: ${formatCurrency(d.total)}원 (${sources})`;
    });

  return [
    `이번 주 총 수입: ${formatCurrency(weekTotal)}원`,
    dayLines.length > 0 ? '\n일별 상세:' : '이번 주 수입 내역 없음',
    ...dayLines,
  ].join('\n');
}

function buildMonthlySummary(data: MonthlyAnalysisInput): string {
  const byDayOfWeek = data.days.reduce<Record<string, number[]>>((acc, d) => {
    (acc[d.dayLabel] ??= []).push(d.total);
    return acc;
  }, {});
  const avgByDay = Object.entries(byDayOfWeek)
    .map(([day, amounts]) => {
      const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
      return `- ${day}요일 평균: ${formatCurrency(Math.round(avg))}원`;
    })
    .join('\n');

  const bySource = data.days.reduce<Partial<Record<RevenueSource, number>>>((acc, d) => {
    (Object.entries(d.bySource) as [RevenueSource, number][]).forEach(([k, v]) => {
      acc[k] = (acc[k] ?? 0) + v;
    });
    return acc;
  }, {});
  const sourceLines = (Object.entries(bySource) as [RevenueSource, number][])
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `- ${SOURCE_LABELS[k]}: ${formatCurrency(v)}원`)
    .join('\n');

  const dailyAvg = data.daysElapsed > 0
    ? Math.round(data.monthTotal / data.daysElapsed)
    : 0;
  const goalProgress = data.monthlyGoal > 0
    ? Math.round((data.monthTotal / data.monthlyGoal) * 100)
    : 0;

  return [
    `목표: ${formatCurrency(data.monthlyGoal)}원 / 현재: ${formatCurrency(data.monthTotal)}원 (${goalProgress}% 달성)`,
    `경과: ${data.daysElapsed}일, 남은 일수: ${data.remainingDays}일, 일 평균: ${formatCurrency(dailyAvg)}원`,
    '',
    '결제수단별 합계:',
    sourceLines || '- 없음',
    '',
    '요일별 평균:',
    avgByDay || '- 데이터 없음',
  ].join('\n');
}

// ─── Cloud Function 호출 ────────────────────────────────────────────────────

const analyzeRevenueFn = functions().httpsCallable<
  { type: 'weekly' | 'monthly'; summary: string },
  { analysis: string }
>('analyzeRevenue');

export const analyzeWeeklyPattern = async (data: WeeklyAnalysisInput): Promise<string> => {
  const { data: result } = await analyzeRevenueFn({ type: 'weekly', summary: buildWeeklySummary(data) });
  return result.analysis;
};

export const analyzeMonthlyPattern = async (data: MonthlyAnalysisInput): Promise<string> => {
  const { data: result } = await analyzeRevenueFn({ type: 'monthly', summary: buildMonthlySummary(data) });
  return result.analysis;
};
