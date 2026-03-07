import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme';

import { firebaseAuth } from '../lib/firebase';

import { CustomAlert } from '../components/CustomAlert';
import { RevenueInputModal } from '../components/RevenueInputModal';
import { RevenueHistoryModal } from '../components/RevenueHistoryModal';
import { SettingsModal } from '../components/SettingsModal';
import { ExpenseInputModal } from '../components/ExpenseInputModal';
import { DrivingInputModal } from '../components/DrivingInputModal';

import { DailyGoalCard } from '../components/DailyGoalCard';
import { TrendChartCard } from '../components/TrendChartCard';

import { useUserDoc } from '../hooks/useUserDoc';
import { useRevenueTracker } from '../hooks/useRevenueTracker';
import { useExpenseTracker } from '../hooks/useExpenseTracker';
import { useDrivingStats } from '../hooks/useDrivingStats';
import { useDailyGoalCalculator } from '../hooks/useDailyGoalCalculator';
import { useStreakCalculator } from '../hooks/useStreakCalculator';

import { formatCurrency } from '../utils/formatUtils';
import type { DashboardScreenProps } from '../types/navigation';
import type { RevenueSource, ExpenseCategory } from '../types/models';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  // --- 데이터 (단일 Firestore 리스너) ---
  const {
    userName,
    monthlyGoal,
    totalRevenue,
    todayRevenue,
    monthlyRevenue,
    monthlyExpense,
    monthlyDrivingMinutes,
    monthlyDistanceKm,
  } = useUserDoc();

  // --- 쓰기 전용 훅 ---
  const { addRevenue } = useRevenueTracker();
  const { addExpense } = useExpenseTracker();
  const { addDrivingSession } = useDrivingStats();

  // --- 파생 계산값 ---
  const netProfit = monthlyRevenue - monthlyExpense;
  const drivingHours = monthlyDrivingMinutes / 60;
  const perHour = drivingHours > 0 ? Math.round(netProfit / drivingHours) : null;
  const perKm = monthlyDistanceKm > 0 ? Math.round(netProfit / monthlyDistanceKm) : null;
  const progressPct = monthlyGoal > 0 ? (monthlyRevenue / monthlyGoal) * 100 : 0;

  // --- 목표/스트릭 계산 ---
  const dailyGoalData = useDailyGoalCalculator(monthlyGoal, monthlyRevenue, todayRevenue);
  const streakData = useStreakCalculator(monthlyGoal, todayRevenue, dailyGoalData.dailyTarget);

  // --- 알림 상태 (showAlert보다 먼저 선언) ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  // --- 스트릭 보상 알림 ---
  const prevFreezeCountRef = useRef(streakData.freezeCount);
  useEffect(() => {
    if (streakData.freezeCount > prevFreezeCountRef.current) {
      const added = streakData.freezeCount - prevFreezeCountRef.current;
      showAlert('축하합니다! 🎉', `7일 연속 달성 보상으로\n휴무권 ${added}개를 획득하셨습니다! 🛡️`);
    }
    prevFreezeCountRef.current = streakData.freezeCount;
  }, [streakData.freezeCount]);

  // --- 모달 상태 ---
  const [isInputModalVisible, setInputModalVisible] = useState(false);
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [isDrivingModalVisible, setDrivingModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);

  // --- 이벤트 핸들러 ---
  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error('로그아웃 에러:', error);
      showAlert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  const handleRevenueConfirm = async (amount: number, source: RevenueSource) => {
    const success = await addRevenue(amount, source);
    if (!success) showAlert('오류', '저장에 실패했습니다.');
  };

  const handleExpenseConfirm = async (amount: number, category: ExpenseCategory) => {
    const success = await addExpense(amount, category);
    if (!success) showAlert('오류', '지출 저장에 실패했습니다.');
  };

  const handleDrivingConfirm = async (minutes: number, distanceKm: number) => {
    const success = await addDrivingSession(minutes, distanceKm);
    if (!success) showAlert('오류', '운행 기록 저장에 실패했습니다.');
  };

  // --- 렌더 ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🚕 운행 성과 대시보드</Text>
          <Text style={styles.greeting}>
            {userName ? `${userName}님, 안전운행 하세요!` : '오늘도 안전운행 하세요!'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {streakData.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streakData.currentStreak}일 연속</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('GoalSetting', { initialGoal: monthlyGoal })}>
          <DailyGoalCard data={dailyGoalData} />
        </TouchableOpacity>

        <TrendChartCard />

        {/* 이번 달 총 수입 */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => setHistoryModalVisible(true)}
        >
          <View style={styles.cardHeaderBetween}>
            <Text style={styles.cardLabel}>💰 이번 달 총 수입</Text>
            <Text style={styles.historyIcon}>📄</Text>
          </View>
          <Text style={styles.mainValue}>{formatCurrency(monthlyRevenue)} 원</Text>
          <Text style={styles.trendText}>누적 총 수입: {formatCurrency(totalRevenue)} 원</Text>
          <View style={styles.expenseSummaryRow}>
            <Text style={styles.netProfitText}>순이익: {formatCurrency(netProfit)} 원</Text>
            <Text style={styles.expenseText}>이달 지출: {formatCurrency(monthlyExpense)} 원</Text>
          </View>
        </TouchableOpacity>

        {/* 운행 효율 */}
        <View style={styles.efficiencyHeader}>
          <Text style={styles.efficiencyTitle}>📊 운행 효율</Text>
          <TouchableOpacity onPress={() => setDrivingModalVisible(true)}>
            <Text style={styles.addRecordButton}>+ 기록 추가</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.cardLabel}>시간당 순수익</Text>
            <Text style={styles.subValue}>
              {perHour !== null ? formatCurrency(perHour) : '--'}
              <Text style={styles.unit}> 원</Text>
            </Text>
            <Text style={styles.trendText}>
              {monthlyDrivingMinutes > 0
                ? `이달 ${Math.floor(monthlyDrivingMinutes / 60)}h ${monthlyDrivingMinutes % 60}m`
                : '기록 없음'}
            </Text>
          </View>

          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.cardLabel}>Km당 순수익</Text>
            <Text style={styles.subValue}>
              {perKm !== null ? formatCurrency(perKm) : '--'}
              <Text style={styles.unit}> 원/km</Text>
            </Text>
            <Text style={styles.trendText}>
              {monthlyDistanceKm > 0 ? `이달 ${monthlyDistanceKm} km` : '기록 없음'}
            </Text>
          </View>
        </View>

        {/* 월 목표 달성률 */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>월 목표 달성률</Text>
          <Text style={styles.goalText}>목표: {formatCurrency(monthlyGoal)} 원</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPct)}%` }]} />
          </View>
          <Text style={styles.progressStatusText}>
            {Math.round(progressPct)}% 달성 (현재 수입 기준)
          </Text>
        </View>

        <View style={styles.screenBottomSpacer} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fabExpense} onPress={() => setExpenseModalVisible(true)}>
        <Text style={styles.fabText}>- 지출 입력</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fab} onPress={() => setInputModalVisible(true)}>
        <Text style={styles.fabText}>+ 수입 입력</Text>
      </TouchableOpacity>

      {/* 모달 */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
      />
      <RevenueInputModal
        visible={isInputModalVisible}
        onClose={() => setInputModalVisible(false)}
        onConfirm={handleRevenueConfirm}
      />
      <ExpenseInputModal
        visible={isExpenseModalVisible}
        onClose={() => setExpenseModalVisible(false)}
        onConfirm={handleExpenseConfirm}
      />
      <DrivingInputModal
        visible={isDrivingModalVisible}
        onClose={() => setDrivingModalVisible(false)}
        onConfirm={handleDrivingConfirm}
      />
      <RevenueHistoryModal
        visible={isHistoryModalVisible}
        onClose={() => setHistoryModalVisible(false)}
      />
      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        onLogout={handleLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    marginRight: 12,
  },
  streakText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  scrollContent: {
    padding: 16,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666666',
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
  trendText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  expenseSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
  efficiencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  efficiencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  addRecordButton: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: (width - 48) / 2,
    marginBottom: 0,
    padding: 16,
  },
  subValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  unit: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'normal',
  },
  goalText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 6,
  },
  progressStatusText: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabExpense: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#E53935',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginLeft: 4,
  },
  settingsIcon: {
    fontSize: 20,
  },
  screenBottomSpacer: {
    height: 100,
  },
});
