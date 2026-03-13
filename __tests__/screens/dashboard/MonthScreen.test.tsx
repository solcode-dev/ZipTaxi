import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import renderer from 'react-test-renderer';
import { MonthScreen } from '../../../src/screens/dashboard/MonthScreen';
import { createComponent } from '../../helpers/renderHook';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// DashboardContext mock
jest.mock('../../../src/context/DashboardContext', () => ({
  useDashboard: jest.fn(),
}));
import { useDashboard } from '../../../src/context/DashboardContext';

// Vector Icons mock
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Navigation mock
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    addListener: jest.fn(),
  }),
}));

// Mock sub-components completely to avoid triggering their own data fetches & errors
// DashboardContext already mocks `revenueData`, so we just mock these nested UI parts
// for cleaner snapshot testing.
jest.mock('../../../src/components/DrivingStatsCard', () => {
  const { Text: RNText } = require('react-native');
  return {
    DrivingStatsCard: () => <RNText>DrivingStatsCard</RNText>,
  };
});

jest.mock('../../../src/components/TrendChartCard', () => {
  const { Text: RNText } = require('react-native');
  return {
    TrendChartCard: () => <RNText>TrendChartCard</RNText>,
  };
});

jest.mock('../../../src/components/RevenueHistoryModal', () => {
  const { View, Text: RNText } = require('react-native');
  return {
    RevenueHistoryModal: ({ visible, _onClose }: any) => {
      // 단순하게 visible 상태에 따라 보이고 안 보이고를 모킹
      return visible ? (
        <View testID="revenue-history-modal-mock">
          <RNText>RevenueHistoryModal</RNText>
        </View>
      ) : null;
    },
  };
});

describe('MonthScreen', () => {
  const mockContextValue = {
    // 유저 문서 (실시간)
    monthlyGoal: 300000,
    totalRevenue: 100000,
    monthlyRevenue: 100000,
    monthlyExpense: 20000,
    // 파생 계산값
    netProfit: 80000,
    progressPct: 33.3,
    dailyGoalData: {
      dailyTarget: 10000,
      status: 'AHEAD_OF_SCHEDULE',
    },
    streakData: {
      currentStreak: 5,
    },
    // 나머지는 MonthScreen에서 현재 사용하지 않으면 생략 가능하나
    // 필요 시 더미 값 제공
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDashboard as jest.Mock).mockReturnValue(mockContextValue);
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );

  it('DashboardContext 데이터를 기반으로 MonthlySummaryCard가 올바르게 렌더링된다', () => {
    const tree = createComponent(
      <TestWrapper>
        <MonthScreen />
      </TestWrapper>
    );

    const texts = tree.root.findAllByType(Text).map((t: any) => t.props.children);
    const joinedTexts = texts.flat(Infinity).join('');

    // Context에 주입된 값들이 렌더링되는지 확인 (total, goal 대비 백분율 등)
    expect(joinedTexts).toContain('이번 달 총 수입');
    expect(joinedTexts).toContain('100,000'); // total
    expect(joinedTexts).toContain('33%'); 
  });

  it('이번 달 총 수입 블록을 탭하면 RevenueHistoryModal이 열린다', () => {
    const tree = createComponent(
      <TestWrapper>
        <MonthScreen />
      </TestWrapper>
    );

    // 모달은 처음에 열려있지 않음 (모의된 컴포넌트 내부 텍스트 없음)
    let modalTexts = tree.root.findAllByType(Text).filter(
      (t: any) => t.props.children === 'RevenueHistoryModal'
    );
    expect(modalTexts.length).toBe(0);

    // "이번 달 총 수입" 영역 터치 가능 버튼 찾기
    const buttons = tree.root.findAllByType(TouchableOpacity);
    const historyButton = buttons.find((b: any) => {
      const texts = b.findAllByType(Text);
      return texts.some((t: any) => t.props.children === '이번 달 총 수입');
    });

    // 탭 클릭
    renderer.act(() => {
      historyButton?.props.onPress();
    });

    // 모달 컴포넌트가 나타났는지 검증
    modalTexts = tree.root.findAllByType(Text).filter(
      (t: any) => t.props.children === 'RevenueHistoryModal'
    );
    expect(modalTexts.length).toBeGreaterThan(0);
  });

  it('하단의 "월간 리포트 보기" 버튼 클릭 시 navigation.navigate("MonthlyReport")가 호출된다', () => {
    const tree = createComponent(
      <TestWrapper>
        <MonthScreen />
      </TestWrapper>
    );

    const buttons = tree.root.findAllByType(TouchableOpacity);
    const navigateButton = buttons.find((b: any) => {
      const texts = b.findAllByType(Text);
      return texts.some((t: any) => t.props.children === '월간 리포트 보기');
    });

    expect(navigateButton).toBeDefined();

    renderer.act(() => {
      navigateButton?.props.onPress();
    });

    // navigation 호출 확인
    expect(mockNavigate).toHaveBeenCalledWith('MonthlyReport');
  });
});
