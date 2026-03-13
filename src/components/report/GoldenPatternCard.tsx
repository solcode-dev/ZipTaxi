import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCurrency } from '../../utils/formatUtils';
import { getDayLabel } from '../../utils/dateUtils';
import { cardStyle, sectionLabelStyle, COLORS } from './shared';

const DOW_SHORT  = ['일', '월', '화', '수', '목', '금', '토'];
const SLOT_LABELS = ['새벽(0-5시)', '오전(6-11시)', '오후(12-17시)', '야간(18-23시)'];

const BAR_MAX_HEIGHT = 48;

interface Props {
  bestDayOfWeek: number | null;
  bestTimeSlot:  number | null;
  bestDay:       { dateStr: string; amount: number } | null;
  byDayOfWeek:   number[];
  byTimeSlot:    number[];
}

// ─── 요일 미니 바차트 ─────────────────────────────────────────────────────────

const DowBarChart = ({ byDayOfWeek, bestDayOfWeek }: { byDayOfWeek: number[]; bestDayOfWeek: number }) => {
  const max = Math.max(...byDayOfWeek, 1);
  return (
    <View style={styles.barChart}>
      {DOW_SHORT.map((label, i) => {
        const isBest  = i === bestDayOfWeek;
        const barH    = Math.max(4, Math.round((byDayOfWeek[i] / max) * BAR_MAX_HEIGHT));
        return (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: barH, backgroundColor: isBest ? COLORS.primary : `${COLORS.primary}30` },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, isBest && styles.barLabelBest]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── 패턴 행 ─────────────────────────────────────────────────────────────────

interface PatternRowProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}

const PatternRow = ({ icon, label, value, sub }: PatternRowProps) => (
  <View style={styles.row}>
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      {sub && <Text style={styles.rowSub}>{sub}</Text>}
    </View>
  </View>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const GoldenPatternCard = memo(({ bestDayOfWeek, bestTimeSlot, bestDay, byDayOfWeek, byTimeSlot }: Props) => {
  const hasData = bestDayOfWeek !== null || bestTimeSlot !== null || bestDay !== null;
  if (!hasData) return null;

  const slotTotal = byTimeSlot.reduce((a, b) => a + b, 0);

  return (
    <View style={cardStyle}>
      <Text style={sectionLabelStyle}>황금 패턴</Text>

      {/* 요일별 수입 바차트 */}
      {bestDayOfWeek !== null && (
        <>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>최고 수입 요일</Text>
            <Text style={styles.chartBest}>{DOW_SHORT[bestDayOfWeek]}요일</Text>
          </View>
          <DowBarChart byDayOfWeek={byDayOfWeek} bestDayOfWeek={bestDayOfWeek} />
        </>
      )}

      {/* 황금 시간대 */}
      {bestTimeSlot !== null && (
        <>
          <View style={styles.divider} />
          <PatternRow
            icon="time-outline"
            label="황금 시간대"
            value={SLOT_LABELS[bestTimeSlot]}
            sub={slotTotal > 0
              ? `전체의 ${Math.round((byTimeSlot[bestTimeSlot] / slotTotal) * 100)}%`
              : undefined}
          />
        </>
      )}

      {/* 최고 하루 */}
      {bestDay !== null && (
        <>
          <View style={styles.divider} />
          <PatternRow
            icon="trophy-outline"
            label="최고 하루"
            value={`${formatCurrency(bestDay.amount)}원`}
            sub={getDayLabel(bestDay.dateStr)}
          />
        </>
      )}
    </View>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 13,
    color: COLORS.neutral,
  },
  chartBest: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: BAR_MAX_HEIGHT + 20,
    marginBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: COLORS.neutral,
  },
  barLabelBest: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 11,
    color: COLORS.neutral,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  rowSub: {
    fontSize: 11,
    color: COLORS.neutral,
  },
});
