import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDashboard } from '../../context/DashboardContext';
import { TrendChartCard } from '../../components/TrendChartCard';
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
  } = useDashboard();

  const [historyVisible, setHistoryVisible] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 이번 달 총 수입 */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setHistoryVisible(true)}
      >
        <View style={styles.cardHeaderBetween}>
          <Text style={styles.cardLabel}>💰 이번 달 총 수입</Text>
          <Text style={styles.historyIcon}>📄</Text>
        </View>
        <Text style={styles.mainValue}>{formatCurrency(monthlyRevenue)} 원</Text>
        <Text style={styles.subText}>누적 총 수입: {formatCurrency(totalRevenue)} 원</Text>
        <View style={styles.profitRow}>
          <Text style={styles.netProfitText}>순이익: {formatCurrency(netProfit)} 원</Text>
          <Text style={styles.expenseText}>이달 지출: {formatCurrency(monthlyExpense)} 원</Text>
        </View>
      </TouchableOpacity>

      {/* 트렌드 차트 */}
      <TrendChartCard />

      {/* 월 목표 달성률 */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>월 목표 달성률</Text>
        <Text style={styles.goalText}>목표: {formatCurrency(monthlyGoal)} 원</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progressPct)}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPct)}% 달성</Text>
      </View>

      {/* 월간 리포트 */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => navigation.navigate('MonthlyReport')}
      >
        <Text style={styles.reportButtonText}>📊 월간 리포트 보기 →</Text>
      </TouchableOpacity>

      <RevenueHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
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
  cardHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  historyIcon: {
    fontSize: 16,
    color: '#999',
  },
  mainValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  netProfitText: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '600',
  },
  expenseText: {
    fontSize: 13,
    color: '#E53935',
    fontWeight: '600',
  },
  goalText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  progressBg: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: 'bold',
  },
  reportButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
