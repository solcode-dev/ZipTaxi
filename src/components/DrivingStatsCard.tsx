import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { formatCurrency } from '../utils/formatUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  monthlyDrivingMinutes: number;
  monthlyDistanceKm: number;
  perHour: number | null;
  perKm: number | null;
  prevPerHour: number | null;
  prevPerKm: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DrivingStatsCard = ({
  monthlyDrivingMinutes,
  monthlyDistanceKm,
  perHour,
  perKm,
  prevPerHour,
  prevPerKm,
}: Props) => {
  if (monthlyDrivingMinutes === 0) return null;

  const hourPct = pctChange(perHour, prevPerHour);
  const kmPct   = pctChange(perKm,   prevPerKm);
  const isUp    = hourPct !== null && hourPct >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>이달 운행 효율</Text>

      {/* 주 지표: 시간당 순수익 */}
      <View style={styles.heroRow}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroSub}>시간당 순수익</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>
              {perHour !== null ? formatCurrency(perHour) : '–'}
            </Text>
            <Text style={styles.heroUnit}>원</Text>
          </View>
        </View>
        {hourPct !== null && (
          <View style={[styles.pctBadge, isUp ? styles.pctBadgeUp : styles.pctBadgeDown]}>
            <Text style={[styles.pctText, isUp ? styles.pctTextUp : styles.pctTextDown]}>
              {isUp ? '+' : ''}{hourPct}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* 보조 지표: km당 순수익 · 총 운행 */}
      <View style={styles.secondaryRow}>
        <View style={styles.secondaryCell}>
          <Text style={styles.secondarySub}>km당 순수익</Text>
          <Text style={styles.secondaryValue}>
            {perKm !== null ? formatCurrency(perKm) : '–'}
            <Text style={styles.secondaryUnit}> 원/km</Text>
          </Text>
          {kmPct !== null && (
            <Text style={[styles.secondaryTrend, kmPct >= 0 ? styles.trendUp : styles.trendDown]}>
              {kmPct >= 0 ? '+' : ''}{kmPct}% 전월 대비
            </Text>
          )}
        </View>

        <View style={styles.cellDivider} />

        <View style={styles.secondaryCell}>
          <Text style={styles.secondarySub}>총 운행</Text>
          <Text style={styles.secondaryValue}>{formatDuration(monthlyDrivingMinutes)}</Text>
          <Text style={styles.secondaryDetail}>{monthlyDistanceKm.toFixed(1)} km</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 14,
  },

  // 주 지표
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    gap: 2,
  },
  heroSub: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  heroUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pctBadgeUp: {
    backgroundColor: '#E8EAF6',
  },
  pctBadgeDown: {
    backgroundColor: '#FFEBEE',
  },
  pctText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pctTextUp: {
    color: '#3949AB',
  },
  pctTextDown: {
    color: '#E53935',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },

  // 보조 지표
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  secondaryCell: {
    flex: 1,
    gap: 3,
  },
  cellDivider: {
    width: 1,
    height: 52,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    alignSelf: 'center',
  },
  secondarySub: {
    fontSize: 11,
    color: '#BDBDBD',
  },
  secondaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
  },
  secondaryUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9E9E9E',
  },
  secondaryDetail: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  secondaryTrend: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendUp: {
    color: '#3949AB',
  },
  trendDown: {
    color: '#E53935',
  },
});
