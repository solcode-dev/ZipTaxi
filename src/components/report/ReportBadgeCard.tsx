import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { cardStyle, COLORS } from './shared';
import type { MonthlyReportData } from '../../hooks/useMonthlyReport';

// ─── Badge definitions (config-driven, priority order) ───────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface BadgeDef {
  id: string;
  check: (d: MonthlyReportData, goal: number) => boolean;
  title: string;
  subtitle: string;
  icon: IoniconName;
  color: string;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'goal_achiever',
    check: (d, goal) => goal > 0 && d.total >= goal,
    title: '목표 달성자',
    subtitle: '이달 목표를 완수했어요',
    icon: 'trophy-outline',
    color: '#F59E0B',
  },
  {
    id: 'night_owl',
    check: d => d.total > 0 && d.byTimeSlot[3] / d.total > 0.4,
    title: '야행성 드라이버',
    subtitle: '야간 운행의 달인이에요',
    icon: 'moon-outline',
    color: COLORS.primary,
  },
  {
    id: 'weekend_warrior',
    check: d => d.total > 0 && (d.byDayOfWeek[0] + d.byDayOfWeek[6]) / d.total > 0.35,
    title: '주말 전사',
    subtitle: '주말이 황금 시간이에요',
    icon: 'sunny-outline',
    color: '#F59E0B',
  },
  {
    id: 'kakao_master',
    check: d => d.total > 0 && d.bySource.kakao / d.total > 0.6,
    title: '카카오T 마스터',
    subtitle: '플랫폼을 잘 활용하고 있어요',
    icon: 'phone-portrait-outline',
    color: '#F59E0B',
  },
  {
    id: 'attendance_king',
    check: d => d.workingDays >= 25,
    title: '개근왕',
    subtitle: `${0}일 연속 출근, 대단해요!`,
    icon: 'calendar-outline',
    color: '#10B981',
  },
];

function computeBadge(data: MonthlyReportData, monthlyGoal: number): BadgeDef | null {
  const found = BADGE_DEFS.find(b => b.check(data, monthlyGoal));
  if (!found) return null;
  // attendance_king subtitle에 실제 workingDays 반영
  if (found.id === 'attendance_king') {
    return { ...found, subtitle: `${data.workingDays}일 출근, 대단해요!` };
  }
  return found;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  data: MonthlyReportData;
  monthlyGoal: number;
}

export const ReportBadgeCard = ({ data, monthlyGoal }: Props) => {
  const badge = computeBadge(data, monthlyGoal);
  if (!badge) return null;

  return (
    <View style={[cardStyle, { backgroundColor: `${badge.color}15` }]}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: `${badge.color}25` }]}>
          <Ionicons name={badge.icon} size={22} color={badge.color} />
        </View>
        <View style={styles.text}>
          <Text style={styles.eyebrow}>이달의 칭호</Text>
          <Text style={[styles.title, { color: badge.color }]}>{badge.title}</Text>
          <Text style={styles.subtitle}>{badge.subtitle}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    color: COLORS.neutral,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.neutral,
  },
});
