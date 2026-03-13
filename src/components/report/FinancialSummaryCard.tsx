import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCurrency } from '../../utils/formatUtils';
import { cardStyle, sectionLabelStyle, COLORS } from './shared';

interface Props {
  total: number;
  expense: number;
  netProfit: number;
  workingDays: number;
  dailyAvg: number;
  prevTotal: number;
}

interface MetricRowProps {
  label: string;
  value: string;
  color?: string;
}

const MetricRow = ({ label, value, color = COLORS.dark }: MetricRowProps) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

export const FinancialSummaryCard = ({ total, expense, netProfit, workingDays, dailyAvg, prevTotal }: Props) => {
  const diff    = total - prevTotal;
  const diffPct = prevTotal > 0 ? Math.round((diff / prevTotal) * 100) : null;
  const isUp    = diff >= 0;

  return (
    <View style={cardStyle}>
      <Text style={sectionLabelStyle}>재무 요약</Text>

      <MetricRow label="총 수입" value={`${formatCurrency(total)}원`} />
      <View style={styles.divider} />
      <MetricRow
        label="총 지출"
        value={`-${formatCurrency(expense)}원`}
        color={expense > 0 ? COLORS.loss : COLORS.neutral}
      />
      <View style={styles.divider} />
      <MetricRow
        label="순이익"
        value={`${netProfit > 0 ? '+' : ''}${formatCurrency(netProfit)}원`}
        color={netProfit > 0 ? COLORS.profit : netProfit < 0 ? COLORS.loss : COLORS.neutral}
      />

      <View style={styles.statRow}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>영업일</Text>
          <Text style={styles.statValue}>{workingDays}일</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>일 평균 수입</Text>
          <Text style={styles.statValue}>{formatCurrency(dailyAvg)}원</Text>
        </View>
      </View>

      {diffPct !== null && (
        <View style={[styles.compareBadge, { backgroundColor: isUp ? '#EEF2FF' : '#FFF3F3' }]}>
          <Ionicons
            name={isUp ? 'trending-up-outline' : 'trending-down-outline'}
            size={14}
            color={isUp ? COLORS.profit : COLORS.loss}
          />
          <Text style={[styles.compareText, { color: isUp ? COLORS.profit : COLORS.loss }]}>
            전월 대비 {isUp ? '+' : ''}{diffPct}%{'  '}({isUp ? '+' : ''}{formatCurrency(diff)}원)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: COLORS.neutral,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  statRow: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.neutral,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  compareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  compareText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
