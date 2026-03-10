import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDashboard } from '../../context/DashboardContext';
import { DailyGoalCard } from '../../components/DailyGoalCard';
import { CustomAlert } from '../../components/CustomAlert';
import { RevenueInputModal } from '../../components/RevenueInputModal';
import { ExpenseInputModal } from '../../components/ExpenseInputModal';
import { formatCurrency } from '../../utils/formatUtils';
import { theme } from '../../theme';
import type { RootStackParamList } from '../../types/navigation';
import type { RevenueSource, ExpenseCategory } from '../../types/models';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export const TodayScreen = () => {
  const navigation = useNavigation<RootNav>();
  const {
    monthlyGoal, todayRevenue, todayExpense,
    dailyGoalData, addRevenue, addExpense,
  } = useDashboard();

  const [revenueModalVisible, setRevenueModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [alertVisible,        setAlertVisible]        = useState(false);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* 일일 목표 카드 */}
      <View style={styles.goalCardWrapper}>
        <DailyGoalCard data={dailyGoalData} todayRevenue={todayRevenue} />
        <TouchableOpacity
          onPress={() => navigation.navigate('GoalSetting', { initialGoal: monthlyGoal })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.goalHint}>목표 수정 ›</Text>
        </TouchableOpacity>
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
  goalHint: {
    textAlign: 'right',
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 6,
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
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
