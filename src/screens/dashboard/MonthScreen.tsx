import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useDashboard } from '../../context/DashboardContext';
import { TrendChartCard } from '../../components/TrendChartCard';
import { DrivingStatsCard } from '../../components/DrivingStatsCard';
import { RevenueHistoryModal } from '../../components/RevenueHistoryModal';
import { formatCurrency } from '../../utils/formatUtils';
import { theme } from '../../theme';
import type { RootStackParamList } from '../../types/navigation';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export const MonthScreen = () => {
  const navigation = useNavigation<RootNav>();
  const {
    totalRevenue, monthlyRevenue, monthlyExpense,
    netProfit, progressPct, monthlyGoal,
    monthlyDrivingMinutes, monthlyDistanceKm,
    perHour, perKm, prevPerHour, prevPerKm,
  } = useDashboard();

  const [historyVisible, setHistoryVisible] = useState(false);

  const dailyAvg = Math.round(monthlyRevenue / new Date().getDate());

  return (
    <View style={styles.screen}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 이번 달 총 수입 */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setHistoryVisible(true)}
      >
        {/* 헤더 */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>이번 달 총 수입</Text>
          <Ionicons name="chevron-forward" size={16} color="#BDBDBD" />
        </View>

        {/* 메인 수치 */}
        <View style={styles.heroRow}>
          <Text style={styles.mainValue}>{formatCurrency(monthlyRevenue)}</Text>
          <Text style={styles.mainUnit}>원</Text>
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 순이익 / 지출 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCell}>
            <Text style={styles.badgeLabel}>순이익</Text>
            <Text style={[styles.badgeValue, netProfit > 0 ? styles.profit : styles.loss]}>
              {netProfit > 0 ? '+' : ''}{formatCurrency(netProfit)}원
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCell}>
            <Text style={styles.badgeLabel}>이달 지출</Text>
            <Text style={[styles.badgeValue, monthlyExpense > 0 ? styles.loss : styles.neutral]}>
              {monthlyExpense > 0 ? '-' : ''}{formatCurrency(monthlyExpense)}원
            </Text>
          </View>
        </View>

        {/* 목표 달성률 */}
        {monthlyGoal > 0 && (
          <View style={styles.goalRow}>
            <View style={styles.goalMeta}>
              <Text style={styles.goalLabel}>목표 {formatCurrency(monthlyGoal)}원</Text>
              <Text style={styles.goalPct}>{Math.round(progressPct)}%</Text>
            </View>
            <View style={styles.goalProgressBg}>
              <View style={[styles.goalProgressFill, { width: `${Math.min(100, progressPct)}%` }]} />
            </View>
          </View>
        )}

        {/* 페이스 / 누적 */}
        <Text style={styles.paceText}>일 평균 {formatCurrency(dailyAvg)}원</Text>
        <Text style={styles.cumulativeText}>누적 수입 {formatCurrency(totalRevenue)}원</Text>
      </TouchableOpacity>

      {/* 운행 효율 */}
      <DrivingStatsCard
        monthlyDrivingMinutes={monthlyDrivingMinutes}
        monthlyDistanceKm={monthlyDistanceKm}
        perHour={perHour}
        perKm={perKm}
        prevPerHour={prevPerHour}
        prevPerKm={prevPerKm}
      />

      {/* 트렌드 차트 */}
      <TrendChartCard />

      <RevenueHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </ScrollView>

    {/* 월간 리포트 — 항상 보이는 하단 고정 */}
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.reportButton}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('MonthlyReport')}
      >
        <Ionicons name="bar-chart-outline" size={18} color="#fff" />
        <Text style={styles.reportButtonText}>월간 리포트 보기</Text>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#F5F7FA',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  mainValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  mainUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F0F0F0',
  },
  badgeLabel: {
    fontSize: 11,
    color: '#BDBDBD',
    fontWeight: '500',
  },
  badgeValue: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  profit: {
    color: '#3949AB',
  },
  loss: {
    color: '#E53935',
  },
  neutral: {
    color: '#9E9E9E',
  },
  goalRow: {
    marginTop: 14,
    gap: 6,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 11,
    color: '#BDBDBD',
  },
  goalPct: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  goalProgressBg: {
    height: 4,
    backgroundColor: '#EEEEEE',
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  paceText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 12,
  },
  cumulativeText: {
    fontSize: 11,
    color: '#BDBDBD',
    marginTop: 4,
  },
  reportButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
