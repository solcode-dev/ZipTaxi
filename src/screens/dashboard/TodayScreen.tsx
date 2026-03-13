import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDashboard } from '../../context/DashboardContext';
import { DailyGoalCard } from '../../components/DailyGoalCard';
import { CustomAlert } from '../../components/CustomAlert';
import { Toast } from '../../components/Toast';
import { RevenueInputModal } from '../../components/RevenueInputModal';
import { ExpenseInputModal } from '../../components/ExpenseInputModal';
import { DrivingInputModal } from '../../components/DrivingInputModal';
import { formatCurrency } from '../../utils/formatUtils';
import { theme } from '../../theme';
import type { RootStackParamList } from '../../types/navigation';
import type { RevenueSource, ExpenseCategory } from '../../types/models';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export const TodayScreen = () => {
  const navigation = useNavigation<RootNav>();
  const {
    monthlyGoal, todayRevenue, todayExpense,
    currentMonthWorkDays, dailyGoalData, addRevenue, addExpense, addDrivingSession,
    todayDrivingRecorded,
  } = useDashboard();

  const [revenueModalVisible, setRevenueModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [drivingModalVisible, setDrivingModalVisible] = useState(false);
  const [alertVisible,        setAlertVisible]        = useState(false);
  const [toastVisible,        setToastVisible]        = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleRevenueConfirm = async (amount: number, source: RevenueSource) => {
    if (!await addRevenue(amount, source)) showAlert('오류', '저장에 실패했습니다.');
  };

  const handleExpenseConfirm = async (amount: number, category: ExpenseCategory) => {
    if (!await addExpense(amount, category)) showAlert('오류', '지출 저장에 실패했습니다.');
  };

  const handleDrivingConfirm = async (minutes: number, distanceKm: number) => {
    if (await addDrivingSession(minutes, distanceKm)) {
      setToastVisible(true);
    } else {
      showAlert('오류', '운행 기록 저장에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 일일 목표 카드 */}
      <View style={styles.goalCardWrapper}>
        <DailyGoalCard
          data={dailyGoalData}
          todayRevenue={todayRevenue}
          onEditGoal={() =>
            navigation.navigate('GoalSetting', {
              initialGoal: monthlyGoal,
              initialWorkDays: currentMonthWorkDays.length > 0 ? currentMonthWorkDays : undefined,
            })
          }
        />
      </View>

      {/* 오늘 요약 */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>오늘 수입</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
            {formatCurrency(todayRevenue)} 원
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>오늘 순수익</Text>
          <Text style={[styles.summaryValue, { color: '#1565C0' }]}>
            {formatCurrency(todayRevenue - todayExpense)} 원
          </Text>
        </View>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setRevenueModalVisible(true)}>
          <Text style={styles.actionBtnText}>💰 수입 기록</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnExpense]}
          onPress={() => setExpenseModalVisible(true)}
        >
          <Text style={styles.actionBtnText}>💸 지출 기록</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.drivingBtn, todayDrivingRecorded && styles.drivingBtnDone]}
        onPress={() => setDrivingModalVisible(true)}
      >
        <Text style={[styles.drivingBtnText, todayDrivingRecorded && styles.drivingBtnTextDone]}>
          {todayDrivingRecorded ? '✓ 오늘 운행 기록됨 · 수정하기' : '🚗 퇴근 후 운행 기록 입력'}
        </Text>
      </TouchableOpacity>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
      />
      <RevenueInputModal
        visible={revenueModalVisible}
        onClose={() => setRevenueModalVisible(false)}
        onConfirm={handleRevenueConfirm}
      />
      <ExpenseInputModal
        visible={expenseModalVisible}
        onClose={() => setExpenseModalVisible(false)}
        onConfirm={handleExpenseConfirm}
      />
      <DrivingInputModal
        visible={drivingModalVisible}
        onClose={() => setDrivingModalVisible(false)}
        onConfirm={handleDrivingConfirm}
      />
      <Toast
        visible={toastVisible}
        message="운행 기록이 저장됐습니다"
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  goalCardWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnExpense: {
    backgroundColor: '#E53935',
    shadowColor: '#E53935',
  },
  drivingBtn: {
    marginHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFD8DC',
    backgroundColor: '#FAFAFA',
  },
  drivingBtnDone: {
    borderColor: '#A5D6A7',
    backgroundColor: '#F1F8E9',
  },
  drivingBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#546E7A',
  },
  drivingBtnTextDone: {
    color: '#388E3C',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
