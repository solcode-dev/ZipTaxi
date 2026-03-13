import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCurrency } from '../../utils/formatUtils';
import { cardStyle, COLORS } from './shared';
import type { MonthlyReportData } from '../../hooks/useMonthlyReport';

// ─── Badge ────────────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface BadgeDef {
  id: string;
  check: (d: MonthlyReportData, goal: number) => boolean;
  title: string;
  subtitle: (d: MonthlyReportData) => string;
  icon: IoniconName;
  color: string;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'goal_achiever',
    check: (d, goal) => goal > 0 && d.total >= goal,
    title: '목표 달성자',
    subtitle: () => '이달 목표를 완수했어요',
    icon: 'trophy-outline',
    color: '#F59E0B',
  },
  {
    id: 'night_owl',
    check: d => d.total > 0 && d.byTimeSlot[3] / d.total > 0.4,
    title: '야행성 드라이버',
    subtitle: () => '야간 운행의 달인이에요',
    icon: 'moon-outline',
    color: COLORS.primary,
  },
  {
    id: 'weekend_warrior',
    check: d => d.total > 0 && (d.byDayOfWeek[0] + d.byDayOfWeek[6]) / d.total > 0.35,
    title: '주말 전사',
    subtitle: () => '주말이 황금 시간이에요',
    icon: 'sunny-outline',
    color: '#F59E0B',
  },
  {
    id: 'kakao_master',
    check: d => d.total > 0 && d.bySource.kakao / d.total > 0.6,
    title: '카카오T 마스터',
    subtitle: () => '플랫폼을 잘 활용하고 있어요',
    icon: 'phone-portrait-outline',
    color: '#F59E0B',
  },
  {
    id: 'attendance_king',
    check: d => d.workingDays >= 25,
    title: '개근왕',
    subtitle: d => `${d.workingDays}일 출근, 대단해요!`,
    icon: 'calendar-outline',
    color: '#10B981',
  },
];

function computeBadge(data: MonthlyReportData, goal: number): { title: string; subtitle: string; icon: IoniconName; color: string } | null {
  const found = BADGE_DEFS.find(b => b.check(data, goal));
  if (!found) return null;
  return { title: found.title, subtitle: found.subtitle(data), icon: found.icon, color: found.color };
}

// ─── Verdict / Compare ───────────────────────────────────────────────────────

function getVerdict(total: number, goal: number, month: number) {
  if (total === 0)     return { text: `${month}월 수입 기록이 없어요`, positive: false };
  if (goal <= 0)       return { text: `${month}월 수입이 마감됐어요`,  positive: true };
  if (total >= goal)   return { text: `${month}월 목표를 달성했어요`,  positive: true };
  return { text: `목표까지 ${formatCurrency(goal - total)}원 남았어요`, positive: false };
}

function getComparison(total: number, prevTotal: number): string | null {
  if (prevTotal === 0) return null;
  const pct = Math.round(((total - prevTotal) / prevTotal) * 100);
  if (pct > 0)  return `전월보다 ${pct}% 더 벌었어요`;
  if (pct < 0)  return `전월보다 ${Math.abs(pct)}% 적었어요`;
  return '전월과 비슷한 수입이에요';
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  total: number;
  monthlyGoal: number;
  prevTotal: number;
  viewDate: Date;
  data: MonthlyReportData;
}

export const ReportHeroCard = ({ total, monthlyGoal, prevTotal, viewDate, data }: Props) => {
  const month   = viewDate.getMonth() + 1;
  const verdict = getVerdict(total, monthlyGoal, month);
  const compare = getComparison(total, prevTotal);
  const badge   = computeBadge(data, monthlyGoal);

  return (
    <View style={[cardStyle, styles.hero]}>
      <Text style={styles.month}>{viewDate.getFullYear()}년 {month}월</Text>
      <Text style={[styles.verdict, { color: verdict.positive ? '#FFFFFF' : '#FFD54F' }]}>
        {verdict.text}
      </Text>
      {compare && <Text style={styles.compare}>{compare}</Text>}

      {badge && (
        <>
          <View style={styles.badgeDivider} />
          <View style={styles.badgeRow}>
            <View style={[styles.badgeIconBox, { backgroundColor: `${badge.color}25` }]}>
              <Ionicons name={badge.icon} size={16} color={badge.color} />
            </View>
            <View style={styles.badgeTextBlock}>
              <Text style={styles.badgeEyebrow}>이달의 칭호</Text>
              <Text style={[styles.badgeTitle, { color: badge.color }]}>{badge.title}</Text>
              <Text style={styles.badgeSub}>{badge.subtitle}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  hero: {
    backgroundColor: COLORS.primary,
  },
  month: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 8,
  },
  verdict: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  compare: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  badgeDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextBlock: {
    flex: 1,
    gap: 1,
  },
  badgeEyebrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  badgeSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
});
