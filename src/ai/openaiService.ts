import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';
import type { RevenueSource } from '../types/models';
import { formatCurrency } from '../utils/formatUtils';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const SOURCE_LABELS: Record<RevenueSource, string> = {
  kakao: '카카오T',
  card: '카드/현금',
  cash: '현금',
  other: '기타',
};

// ─── 공유 데이터 타입 ───────────────────────────────────────────────────────

export interface DailyRevenue {
  dateStr: string;                        // YYYY-MM-DD
  dayLabel: string;                       // '월', '화', ...
  total: number;
  bySource: Record<RevenueSource, number>;
}

export interface WeeklyAnalysisInput {
  days: DailyRevenue[];                   // 월~일 7일 고정
}

export interface MonthlyAnalysisInput {
  days: DailyRevenue[];                   // 해당 월 수입이 있는 날만
  monthTotal: number;
  monthlyGoal: number;
  daysElapsed: number;
  remainingDays: number;
}

// ─── 프롬프트 빌더 ──────────────────────────────────────────────────────────

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
  // 요일별 평균
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

  // 결제수단별 합계
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

// ─── AI 호출 공통 헬퍼 ──────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  '당신은 개인택시 기사님의 수입 데이터를 분석하는 전문가입니다. ' +
  '데이터를 바탕으로 구체적인 패턴("수요일 카카오T 수입이 가장 높습니다" 등)을 찾아 ' +
  '실용적인 조언을 2~3문장으로 제공하세요. 친근하고 격려하는 말투를 사용하세요.';

async function callOpenAI(userContent: string, maxTokens: number): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0].message.content ?? '';
}

// ─── AI 분석 함수 ────────────────────────────────────────────────────────────

export const analyzeWeeklyPattern = (data: WeeklyAnalysisInput): Promise<string> =>
  callOpenAI(
    `이번 주 수입 데이터:\n\n${buildWeeklySummary(data)}\n\n패턴을 분석하고 다음 주 전략을 조언해주세요.`,
    200,
  );

export const analyzeMonthlyPattern = (data: MonthlyAnalysisInput): Promise<string> =>
  callOpenAI(
    `이번 달 수입 데이터:\n\n${buildMonthlySummary(data)}\n\n패턴 분석과 목표 달성 전략을 조언해주세요.`,
    250,
  );
