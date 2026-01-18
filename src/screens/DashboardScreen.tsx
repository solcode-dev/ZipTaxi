import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import { CustomAlert } from '../components/CustomAlert';

import { useDailyGoalCalculator } from '../hooks/useDailyGoalCalculator';
import { DailyGoalCard } from '../components/DailyGoalCard';

const { width } = Dimensions.get('window');

// Mock Data (will be replaced with real data later)
const MOCK_DATA = {
  totalRevenue: 2250000,
  totalRevenueTrend: 5.2, // percentage
  hourlyRevenue: 25000,
  hourlyRevenueTrend: 6.2,
  kmRevenue: 1200,
  kmRevenueTrend: 5.2,
  goalAmount: 5000000,
  currentAmount: 2250000, // 45% (matches totalRevenue for consistency)
  todayRevenue: 156000, // New mock data for today
};

import { useStreakCalculator } from '../hooks/useStreakCalculator';

export const DashboardScreen = ({ navigation }: any) => {
  const [userName, setUserName] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState(0); // Default 0
  
  // Smart Daily Goal Logic
  const dailyGoalData = useDailyGoalCalculator(
    monthlyGoal,
    MOCK_DATA.currentAmount,
    MOCK_DATA.todayRevenue
  );

  // Streak Logic
  const streakData = useStreakCalculator(
    monthlyGoal,
    MOCK_DATA.todayRevenue,
    dailyGoalData.dailyTarget
  );

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      // Real-time listener for user data (Name & Goal)
      const unsubscribe = firestore().collection('users').doc(user.uid)
        .onSnapshot(documentSnapshot => {
          const data = documentSnapshot.data();
          setUserName(data?.name || '기사님');
          setMonthlyGoal(data?.monthlyGoal || 0); // Fetch goal
        });

      return () => unsubscribe();
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const calculateProgress = () => {
    if (monthlyGoal === 0) return 0;
    return (MOCK_DATA.currentAmount / monthlyGoal) * 100;
  };

  const handleGoalCardPress = () => {
    // Navigate to GoalSetting, passing current goal as initial value
    navigation.navigate('GoalSetting', { initialGoal: monthlyGoal });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🚕 운행 성과 대시보드</Text>
          <Text style={styles.greeting}>{userName ? `${userName}님, 안전운행 하세요!` : '오늘도 안전운행 하세요!'}</Text>
        </View>
        {/* Streak Badge */}
        {streakData.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streakData.currentStreak}일 연속</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Smart Daily Goal Card (Touchable for Direct Manipulation) */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleGoalCardPress}>
          <DailyGoalCard data={dailyGoalData} />
        </TouchableOpacity>

        {/* Total Revenue Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>💰 이번 달 총 수입</Text>
          </View>
          <Text style={styles.mainValue}>{formatCurrency(MOCK_DATA.totalRevenue)} 원</Text>
          <Text style={styles.trendText}>전 기간 대비 +{MOCK_DATA.totalRevenueTrend}%</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.gridContainer}>
          {/* Hourly Revenue */}
          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.cardLabel}>시간당 순수익</Text>
            <Text style={styles.subValue}>{formatCurrency(MOCK_DATA.hourlyRevenue)} <Text style={styles.unit}>원</Text></Text>
            <Text style={styles.trendText}>+{MOCK_DATA.hourlyRevenueTrend}%</Text>
          </View>

          {/* Km Revenue */}
          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.cardLabel}>Km당 순수익</Text>
            <Text style={styles.subValue}>{formatCurrency(MOCK_DATA.kmRevenue)} <Text style={styles.unit}>원/km</Text></Text>
            <Text style={styles.trendText}>+{MOCK_DATA.kmRevenueTrend}%</Text>
          </View>
        </View>

        {/* Goal Progress Card (Previously Mocked) */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>월 목표 달성률</Text>
          <Text style={styles.goalText}>목표: {formatCurrency(monthlyGoal)} 원</Text>
          
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, calculateProgress())}%` }]} />
          </View>
          
          <Text style={styles.progressStatusText}>
            {Math.round(calculateProgress())}% 달성 (현재 수입 기준)
          </Text>
        </View>

        <View style={{ height: 100 }} /> 
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => showAlert('알림', '운행 시작 기능은 준비 중입니다.')}
      >
        <Text style={styles.fabText}>운행 시작 🚀</Text>
      </TouchableOpacity>
      
      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Light gray background
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
  streakBadge: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 8,
  },
  mainValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary, // Fixed theme access
    marginBottom: 4,
  },
  trendText: {
    fontSize: 14,
    color: '#4CAF50', // Green
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: (width - 48) / 2, // Half width minus padding
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
    backgroundColor: '#FFC107', // Amber/Yellow for progress
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
    backgroundColor: theme.colors.primary, // Fixed theme access
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: theme.colors.primary, // Fixed theme access
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
});
