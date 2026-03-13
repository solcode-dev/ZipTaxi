import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCurrency } from '../../utils/formatUtils';
import { formatMonthTitle } from '../../utils/dateUtils';
import { cardStyle, sectionLabelStyle, COLORS } from './shared';

interface Props {
  viewDate: Date;
  currentTotal: number;
  previousTotal: number;
}

export const MonthCompareCard = ({ viewDate, currentTotal, previousTotal }: Props) => {
  const prevDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  const diff     = currentTotal - previousTotal;
  const diffPct  = previousTotal > 0 ? Math.round((diff / previousTotal) * 100) : null;
  const positive = diff >= 0;

  return (
    <View style={cardStyle}>
      <Text style={sectionLabelStyle}>전월 대비</Text>

      <View style={styles.compareRow}>
        <View style={styles.monthBlock}>
          <Text style={styles.monthLabel}>{formatMonthTitle(prevDate)}</Text>
          <Text style={styles.monthAmount}>{formatCurrency(previousTotal)}원</Text>
        </View>

        <Ionicons name="arrow-forward-outline" size={20} color={COLORS.neutral} />

        <View style={[styles.monthBlock, styles.monthBlockRight]}>
          <Text style={styles.monthLabel}>{formatMonthTitle(viewDate)}</Text>
          <Text style={styles.monthAmount}>{formatCurrency(currentTotal)}원</Text>
        </View>
      </View>

      {diffPct !== null ? (
        <View style={[styles.badge, { backgroundColor: positive ? '#EEF2FF' : '#FFF3F3' }]}>
          <Ionicons
            name={positive ? 'trending-up-outline' : 'trending-down-outline'}
            size={16}
            color={positive ? COLORS.profit : COLORS.loss}
          />
          <Text style={[styles.badgeText, { color: positive ? COLORS.profit : COLORS.loss }]}>
            {positive ? '+' : ''}{diffPct}%{'  '}
            ({positive ? '+' : ''}{formatCurrency(diff)}원)
          </Text>
        </View>
      ) : (
        <Text style={styles.noData}>전월 데이터가 없습니다.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthBlock: {
    flex: 1,
    gap: 4,
  },
  monthBlockRight: {
    alignItems: 'flex-end',
  },
  monthLabel: {
    fontSize: 11,
    color: COLORS.neutral,
  },
  monthAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  noData: {
    fontSize: 13,
    color: COLORS.neutral,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
