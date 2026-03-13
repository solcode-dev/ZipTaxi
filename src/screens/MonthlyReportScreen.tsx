import React, { useState, useMemo } from 'react';
import {
  View, ScrollView, ActivityIndicator, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useMonthlyReport } from '../hooks/useMonthlyReport';
import { useYearlyRevenue }  from '../hooks/useYearlyRevenue';
import { formatMonthTitle }  from '../utils/dateUtils';

import { ReportHeroCard }       from '../components/report/ReportHeroCard';
import { FinancialSummaryCard } from '../components/report/FinancialSummaryCard';
import { CalendarHeatmapCard }  from '../components/report/CalendarHeatmapCard';
import { GoldenPatternCard }    from '../components/report/GoldenPatternCard';
import { RevenueSourceCard }    from '../components/report/RevenueSourceCard';
import { YearlyTrendCard }      from '../components/report/YearlyTrendCard';
import { COLORS }               from '../components/report/shared';

import type { MonthlyReportScreenProps } from '../types/navigation';

export const MonthlyReportScreen = ({ navigation }: MonthlyReportScreenProps) => {
  const today = useMemo(() => new Date(), []);
  const insets = useSafeAreaInsets();

  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const { current, previous, monthlyGoal, loading, error } = useMonthlyReport(viewDate);
  const { monthly, loading: yearLoading } = useYearlyRevenue(viewDate.getFullYear());

  const canGoNext =
    viewDate.getFullYear() < today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() < today.getMonth());

  const goBack = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => {
    if (canGoNext) setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* 커스텀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>월간 리포트</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* 월 선택 pill — 스크롤 최상단 */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.monthArrow}>
              <Ionicons name="chevron-back" size={16} color={COLORS.dark} />
            </TouchableOpacity>
            <Ionicons name="calendar-outline" size={14} color={COLORS.neutral} />
            <Text style={styles.monthText}>{formatMonthTitle(viewDate)}</Text>
            <TouchableOpacity onPress={goNext} hitSlop={12} style={styles.monthArrow} disabled={!canGoNext}>
              <Ionicons name="chevron-forward" size={16} color={canGoNext ? COLORS.dark : COLORS.divider} />
            </TouchableOpacity>
          </View>

          {/* 1. 이달의 판정 + 칭호 */}
          <ReportHeroCard
            total={current.total}
            monthlyGoal={monthlyGoal}
            prevTotal={previous.total}
            viewDate={viewDate}
            data={current}
          />

          {/* 2. 재무 요약 + 전월 대비 */}
          <FinancialSummaryCard
            total={current.total}
            expense={current.expense}
            netProfit={current.netProfit}
            workingDays={current.workingDays}
            dailyAvg={current.dailyAvg}
            prevTotal={previous.total}
          />

          {/* 3. 수입 캘린더 */}
          <CalendarHeatmapCard
            viewDate={viewDate}
            dailyRevenue={current.dailyRevenue}
          />

          {/* 4. 황금 패턴 */}
          <GoldenPatternCard
            bestDayOfWeek={current.bestDayOfWeek}
            bestTimeSlot={current.bestTimeSlot}
            bestDay={current.bestDay}
            byDayOfWeek={current.byDayOfWeek}
            byTimeSlot={current.byTimeSlot}
          />

          {/* 5. 수입원 분석 */}
          <RevenueSourceCard
            bySource={current.bySource}
            total={current.total}
          />

          {/* 6. 연간 추이 */}
          <YearlyTrendCard
            year={viewDate.getFullYear()}
            monthly={monthly}
            currentMonth={viewDate.getMonth() + 1}
            loading={yearLoading}
          />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.dark,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  monthArrow: {
    padding: 4,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  loader: {
    flex: 1,
    alignSelf: 'center',
  },
  error: {
    margin: 40,
    textAlign: 'center',
    color: COLORS.loss,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
});
