import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { useMonthlyReport } from '../hooks/useMonthlyReport';
import { formatCurrency } from '../utils/formatUtils';
import { formatMonthTitle } from '../utils/dateUtils';
import type { MonthlyReportScreenProps } from '../types/navigation';
import type { RevenueSource } from '../types/models';

const { width } = Dimensions.get('window');

const BAR_COLOR        = '#FFC107';
const BAR_COLOR_TOP    = '#FF8F00';
const CHART_WIDTH      = width - 32 - 40; // screen padding 16*2 + card padding 20*2

const DOW_LABELS  = ['일', '월', '화', '수', '목', '금', '토'];
const SLOT_LABELS = ['새벽\n0-5시', '오전\n6-11시', '오후\n12-17시', '야간\n18-23시'];

/** 만원 단위로 축약 (예: 125000 → "12.5만") */
function formatMan(value: number): string {
  if (value === 0) return '0';
  if (value >= 10000) return `${(value / 10000).toFixed(1)}만`;
  return `${(value / 1000).toFixed(0)}천`;
}

function buildBarData(values: number[], labels: string[]) {
  const maxValue = Math.max(...values, 1);
  return {
    maxValue,
    data: labels.map((label, i) => ({
      value: values[i],
      label,
      frontColor: values[i] === maxValue ? BAR_COLOR_TOP : BAR_COLOR,
      topLabelComponent: () => (
        <Text style={styles.barTopLabel}>{formatMan(values[i])}</Text>
      ),
    })),
  };
}

function DistributionBarCard({
  title,
  values,
  labels,
  barWidth,
  spacing,
  isEmpty,
}: {
  title: string;
  values: number[];
  labels: string[];
  barWidth: number;
  spacing: number;
  isEmpty: boolean;
}) {
  const { data, maxValue } = buildBarData(values, labels);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {isEmpty ? (
        <Text style={styles.emptyText}>이 달 수입 기록이 없습니다.</Text>
      ) : (
        <BarChart
          data={data}
          width={CHART_WIDTH}
          barWidth={barWidth}
          spacing={spacing}
          hideRules
          hideAxesAndRules
          xAxisLabelTextStyle={styles.barLabel}
          topLabelContainerStyle={styles.barTopContainer}
          noOfSections={3}
          maxValue={maxValue}
        />
      )}
    </View>
  );
}

const SOURCE_INFO: Record<RevenueSource, { label: string; color: string }> = {
  kakao: { label: '카카오T', color: '#FFC107' },
  card:  { label: '카드/현금', color: '#1565C0' },
  cash:  { label: '현금', color: '#4CAF50' },
  other: { label: '기타', color: '#9E9E9E' },
};

export const MonthlyReportScreen = ({ navigation: _navigation }: MonthlyReportScreenProps) => {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const { current, previous, loading, error } = useMonthlyReport(viewDate);

  const canGoNext =
    viewDate.getFullYear() < today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() < today.getMonth());

  const goBack = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => {
    if (canGoNext) setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const pieData = useMemo(() => {
    if (current.total === 0) return [];
    return (Object.entries(current.bySource) as [RevenueSource, number][])
      .filter(([, v]) => v > 0)
      .map(([source, value]) => ({
        value,
        color: SOURCE_INFO[source].color,
        text: `${Math.round((value / current.total) * 100)}%`,
        label: SOURCE_INFO[source].label,
      }));
  }, [current]);

  const diff = current.total - previous.total;
  const diffPct = previous.total > 0 ? Math.round((diff / previous.total) * 100) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 월 네비게이션 */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goBack} style={styles.navBtn}>
          <Text style={styles.navArrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{formatMonthTitle(viewDate)}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
          disabled={!canGoNext}
        >
          <Text style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]}>▶</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFC107" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          {/* 월 수입 요약 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 월 수입 요약</Text>
            <Text style={styles.totalAmount}>{formatCurrency(current.total)} 원</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>영업일</Text>
                <Text style={styles.statValue}>{current.workingDays}일</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>일 평균 수입</Text>
                <Text style={styles.statValue}>{formatCurrency(current.dailyAvg)} 원</Text>
              </View>
            </View>
          </View>

          {/* 수입원별 파이 차트 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🥧 수입원별 비율</Text>
            {current.total === 0 ? (
              <Text style={styles.emptyText}>이 달 수입 기록이 없습니다.</Text>
            ) : (
              <>
                <View style={styles.chartWrapper}>
                  <PieChart
                    data={pieData}
                    donut
                    showText
                    textColor="#333"
                    radius={width * 0.28}
                    innerRadius={width * 0.15}
                    textSize={11}
                    focusOnPress
                  />
                </View>
                <View style={styles.legend}>
                  {pieData.map(item => (
                    <View key={item.label} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={styles.legendAmount}>{formatCurrency(item.value)} 원</Text>
                      <Text style={[styles.legendPct, { color: item.color }]}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* 요일별 수입 분포 */}
          <DistributionBarCard
            title="📅 요일별 수입 분포"
            values={current.byDayOfWeek}
            labels={DOW_LABELS}
            barWidth={CHART_WIDTH / 9}
            spacing={CHART_WIDTH / 18}
            isEmpty={current.total === 0}
          />

          {/* 시간대별 수입 분포 */}
          <DistributionBarCard
            title="🕐 시간대별 수입 분포"
            values={current.byTimeSlot}
            labels={SLOT_LABELS}
            barWidth={CHART_WIDTH / 6}
            spacing={CHART_WIDTH / 12}
            isEmpty={current.total === 0}
          />

          {/* 전월 대비 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 전월 대비</Text>
            <View style={styles.compareRow}>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>
                  {formatMonthTitle(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                </Text>
                <Text style={styles.compareAmount}>{formatCurrency(previous.total)} 원</Text>
              </View>
              <Text style={styles.compareArrow}>→</Text>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>{formatMonthTitle(viewDate)}</Text>
                <Text style={styles.compareAmount}>{formatCurrency(current.total)} 원</Text>
              </View>
            </View>

            {diffPct !== null ? (
              <View style={[styles.diffBadge, { backgroundColor: diff >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
                <Text style={[styles.diffText, { color: diff >= 0 ? '#2E7D32' : '#C62828' }]}>
                  {diff >= 0 ? '▲' : '▼'} {Math.abs(diffPct)}%{'  '}
                  ({diff >= 0 ? '+' : ''}{formatCurrency(diff)} 원)
                </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>전월 데이터가 없습니다.</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  navBtn: {
    padding: 12,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navArrow: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  navArrowDisabled: {
    color: '#999',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 24,
    minWidth: 120,
    textAlign: 'center',
  },
  loader: {
    marginTop: 60,
  },
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
    marginBottom: 16,
  },
  totalAmount: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  legend: {
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  legendAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginRight: 8,
  },
  legendPct: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  compareItem: {
    flex: 1,
    alignItems: 'center',
  },
  compareArrow: {
    fontSize: 20,
    color: '#999',
    marginHorizontal: 8,
  },
  compareLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    textAlign: 'center',
  },
  compareAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  diffBadge: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  diffText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#E53935',
    textAlign: 'center',
    marginTop: 60,
  },
  barTopContainer: {
    marginBottom: 4,
  },
  barTopLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
});
