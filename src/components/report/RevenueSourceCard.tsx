import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../../utils/formatUtils';
import { cardStyle, sectionLabelStyle, COLORS } from './shared';
import type { RevenueSource } from '../../types/models';

const SOURCE_CONFIG: Record<RevenueSource, { label: string; color: string }> = {
  kakao: { label: '카카오T', color: '#F59E0B' },
  card:  { label: '카드',    color: COLORS.profit },
  cash:  { label: '현금',    color: '#10B981' },
  other: { label: '기타',    color: COLORS.neutral },
};

interface Props {
  bySource: Record<RevenueSource, number>;
  total: number;
}

export const RevenueSourceCard = memo(({ bySource, total }: Props) => {
  if (total === 0) return null;

  const entries = (Object.entries(bySource) as [RevenueSource, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <View style={cardStyle}>
      <Text style={sectionLabelStyle}>수입원 분석</Text>

      {/* 비율 스트립 */}
      <View style={styles.strip}>
        {entries.map(([source, amount]) => (
          <View
            key={source}
            style={[styles.stripSegment, { flex: amount, backgroundColor: SOURCE_CONFIG[source].color }]}
          />
        ))}
      </View>

      {/* 수입원별 행 */}
      {entries.map(([source, amount]) => {
        const { label, color } = SOURCE_CONFIG[source];
        const pct = Math.round((amount / total) * 100);
        return (
          <View key={source} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.sourceLabel}>{label}</Text>
            <Text style={styles.pct}>{pct}%</Text>
            <Text style={styles.amount}>{formatCurrency(amount)}원</Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  stripSegment: {
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sourceLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
  },
  pct: {
    fontSize: 13,
    color: COLORS.neutral,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  amount: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '700',
    width: 88,
    textAlign: 'right',
  },
});
