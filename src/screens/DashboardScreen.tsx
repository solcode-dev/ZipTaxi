import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme';
import auth from '@react-native-firebase/auth';
import { getFirestore, doc, onSnapshot } from '@react-native-firebase/firestore';

import { CustomAlert } from '../components/CustomAlert';
import { RevenueInputModal } from '../components/RevenueInputModal';
import { RevenueHistoryModal } from '../components/RevenueHistoryModal';
import { SettingsModal } from '../components/SettingsModal';

import { useDailyGoalCalculator } from '../hooks/useDailyGoalCalculator';
import { DailyGoalCard } from '../components/DailyGoalCard';
import { useStreakCalculator } from '../hooks/useStreakCalculator';
import { TrendChartCard } from '../components/TrendChartCard';
import { useRevenueTracker } from '../hooks/useRevenueTracker';

const { width } = Dimensions.get('window');

// Mock Data (will be replaced with real data later)
const MOCK_DATA = {
  // totalRevenue: 2250000, -> Replaced by Hook
  totalRevenueTrend: 5.2, // percentage (Keep Mock for Phase 1)
  hourlyRevenue: 25000,   // (Keep Mock)
  hourlyRevenueTrend: 6.2,
  kmRevenue: 1200,        // (Keep Mock)
  kmRevenueTrend: 5.2,
  // goalAmount: 5000000, -> Replaced by Hook/State
  // currentAmount: 2250000, -> Replaced by Hook
  // todayRevenue: 156000, -> Replaced by Hook
};

export const DashboardScreen = ({ navigation }: any) => {
  const [userName, setUserName] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState(0); // Default 0
  
  // Real Revenue Tracker
  const { totalRevenue, todayRevenue, monthlyRevenue, addRevenue } = useRevenueTracker();

  // Smart Daily Goal Logic (Now using Real Data)
  const dailyGoalData = useDailyGoalCalculator(
    monthlyGoal,
    monthlyRevenue, // Use Real Monthly Revenue
    todayRevenue    // Use Real Today Revenue
  );

  // Streak Logic (Now using Real Data)
  const streakData = useStreakCalculator(
    monthlyGoal,
    todayRevenue,
    dailyGoalData.dailyTarget
  );

  // [Feature #5] Reward Notification Logic
  const prevFreezeCountRef = React.useRef(streakData.freezeCount);

  useEffect(() => {
    // Check if freezeCount increased
    if (streakData.freezeCount > prevFreezeCountRef.current) {
      const added = streakData.freezeCount - prevFreezeCountRef.current;
      showAlert("축하합니다! 🎉", `7일 연속 달성 보상으로\n휴무권 ${added}개를 획득하셨습니다! 🛡️`);
    }
    // Update ref
    prevFreezeCountRef.current = streakData.freezeCount;
  }, [streakData.freezeCount]);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
  const [isInputModalVisible, setInputModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  
  // Settings Logic
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };
  
  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      showAlert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  const handleRevenueConfirm = async (amount: number, source: any) => {
      const success = await addRevenue(amount, source);
      if (success) {
          // Play sound here later
          // showAlert('입력 완료', `${amount.toLocaleString()}원이 저장되었습니다.`); 
          // Note: UX said "Toast" style. For now, visual update of number is enough + maybe simple Alert or nothing for speed.
          // Let's show a quick alert or just close. "성취감" might need a nice animation later.
          // For now, let's keep it fast.
      } else {
          showAlert('오류', '저장에 실패했습니다.');
      }
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      // Real-time listener for user data (Name & Goal) using Modular SDK
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);

      const unsubscribe = onSnapshot(userDocRef, (documentSnapshot) => {
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
    return (monthlyRevenue / monthlyGoal) * 100;
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
        
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {/* Streak Badge */}
            {streakData.currentStreak > 0 && (
            <View style={[styles.streakBadge, { marginRight: 12 }]}>
                <Text style={styles.streakText}>🔥 {streakData.currentStreak}일 연속</Text>
            </View>
            )}

            {/* Settings Button */}
            <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setSettingsModalVisible(true)}
            >
                <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Smart Daily Goal Card (Touchable for Direct Manipulation) */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleGoalCardPress}>
          <DailyGoalCard 
            data={dailyGoalData} 
          />
        </TouchableOpacity>

        {/* Trend Analysis Chart */}
        <TrendChartCard />

        {/* Total Revenue Card (Clickable for History) */}
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.7}
          onPress={() => setHistoryModalVisible(true)}
        >
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <Text style={styles.cardLabel}>💰 이번 달 총 수입</Text>
            <Text style={{ fontSize: 16, color: '#999' }}>📄</Text>
          </View>
          <Text style={styles.mainValue}>{formatCurrency(monthlyRevenue)} 원</Text>
          <Text style={styles.trendText}>누적 총 수입: {formatCurrency(totalRevenue)} 원</Text>
        </TouchableOpacity>

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
        onPress={() => setInputModalVisible(true)}
      >
        <Text style={styles.fabText}>+ 수입 입력</Text>
      </TouchableOpacity>
      
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
  settingsButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginLeft: 4,
  },
  settingsIcon: {
    fontSize: 20,
  },
});
