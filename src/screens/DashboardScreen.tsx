import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme';

// 중앙 집중식 Firebase 서비스 레이어에서 필요한 기능을 가져옵니다.
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { doc, onSnapshot } from '@react-native-firebase/firestore';

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

/**
 * [대시보드 화면 컴포넌트]
 * 사용자의 수익 현황, 목표 달성률, 연속 달성 기록 등을 종합적으로 보여줍니다.
 * 실시간 데이터 업데이트와 수익 입력 기능을 포함합니다.
 */
export const DashboardScreen = ({ navigation }: any) => {
  const [userName, setUserName] = useState(''); // 사용자 이름
  const [monthlyGoal, setMonthlyGoal] = useState(0); // 이번 달 수입 목표
  
  // 수입 추적 커스텀 훅을 사용하여 실시간 수익 데이터를 가져옵니다.
  const { totalRevenue, todayRevenue, monthlyRevenue, addRevenue } = useRevenueTracker();

  // 이번 달 남은 일수와 현재 수익을 바탕으로 오늘 목표치를 계산합니다.
  const dailyGoalData = useDailyGoalCalculator(
    monthlyGoal,
    monthlyRevenue,
    todayRevenue
  );

  // 현재까지의 연속 기록(Streak)을 계산합니다.
  const streakData = useStreakCalculator(
    monthlyGoal,
    todayRevenue,
    dailyGoalData.dailyTarget
  );

  // [보상 알림 로직]
  // 휴무권(FreezeCount)이 증가하면 축하 알림창을 띄워줍니다.
  const prevFreezeCountRef = React.useRef(streakData.freezeCount);

  useEffect(() => {
    if (streakData.freezeCount > prevFreezeCountRef.current) {
      const added = streakData.freezeCount - prevFreezeCountRef.current;
      showAlert("축하합니다! 🎉", `7일 연속 달성 보상으로\n휴무권 ${added}개를 획득하셨습니다! 🛡️`);
    }
    prevFreezeCountRef.current = streakData.freezeCount;
  }, [streakData.freezeCount]);
  
  // 각종 모달 및 알림창 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
  const [isInputModalVisible, setInputModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);

  /**
   * @description 알림창 호출 함수
   */
  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };
  
  /**
   * [로그아웃 처리]
   * Firebase 인증 세션을 종료하고 로그인 화면으로 이동합니다.
   */
  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error('로그아웃 에러:', error);
      showAlert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  /**
   * [수입 입력 처리]
   * 입력 모달에서 수입을 입력하면 DB에 저장하고 성공 여부를 처리합니다.
   */
  const handleRevenueConfirm = async (amount: number, source: any) => {
      const success = await addRevenue(amount, source);
      if (!success) {
          showAlert('오류', '저장에 실패했습니다.');
      }
  };

  /**
   * [사용자 기본 정보 구독]
   * 이름, 목표 금액 등 Firestore의 사용자 문서를 실시간으로 감시합니다.
   */
  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (user) {
      const userDocRef = doc(firebaseDb, 'users', user.uid);

      // 실시간 리스너 연결
      const unsubscribe = onSnapshot(userDocRef, (documentSnapshot) => {
        const data = documentSnapshot.data();
        if (data) {
          setUserName(data.name || '기사님');
          setMonthlyGoal(data.monthlyGoal || 0);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  /**
   * @description 숫자를 천 단위 콤마 형식으로 변환합니다.
   */
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  /**
   * @description 이번 달 목표 달성률을 계산합니다 (0 ~ 100).
   */
  const calculateProgress = () => {
    if (monthlyGoal === 0) return 0;
    return (monthlyRevenue / monthlyGoal) * 100;
  };

  /**
   * @description 목표 설정 카드를 눌렀을 때 목표 수정 화면으로 이동합니다.
   */
  const handleGoalCardPress = () => {
    navigation.navigate('GoalSetting', { initialGoal: monthlyGoal });
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더: 제목 및 기사님 인사말 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🚕 운행 성과 대시보드</Text>
          <Text style={styles.greeting}>{userName ? `${userName}님, 안전운행 하세요!` : '오늘도 안전운행 하세요!'}</Text>
        </View>
        
        <View style={styles.headerRight}>
            {/* 연속 기록 배지 */}
            {streakData.currentStreak > 0 && (
            <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streakData.currentStreak}일 연속</Text>
            </View>
            )}

            {/* 설정(기어) 버튼 */}
            <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setSettingsModalVisible(true)}
            >
                <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 오늘 수익 목표 카드 (클릭 시 이동 가능) */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleGoalCardPress}>
          <DailyGoalCard 
            data={dailyGoalData} 
          />
        </TouchableOpacity>

        {/* 수입 변화 추이 차트 카드 */}
        <TrendChartCard />

        {/* 이번 달 총 수익 카드 (클릭 시 상세 내역 모달 표시) */}
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
        </TouchableOpacity>

        {/* 시간당/Km당 효율 통계 그리드 (Mock 데이터 포함) */}
        <View style={styles.gridContainer}>
          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.cardLabel}>시간당 순수익</Text>
            <Text style={styles.subValue}>25,000 <Text style={styles.unit}>원</Text></Text>
            <Text style={styles.trendText}>+6.2%</Text>
          </View>

          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.cardLabel}>Km당 순수익</Text>
            <Text style={styles.subValue}>1,200 <Text style={styles.unit}>원/km</Text></Text>
            <Text style={styles.trendText}>+5.2%</Text>
          </View>
        </View>

        {/* 월 목표 달성률 진행 바 카드 */}
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

        {/* 스크롤 여백 */}
        <View style={styles.screenBottomSpacer} /> 
      </ScrollView>

      {/* 수입 입력을 위한 플로팅 액션 버튼 (FAB) */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setInputModalVisible(true)}
      >
        <Text style={styles.fabText}>+ 수입 입력</Text>
      </TouchableOpacity>
      
      {/* 팝업 모달창들 */}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
