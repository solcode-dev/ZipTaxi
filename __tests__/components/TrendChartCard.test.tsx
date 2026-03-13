import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { TrendChartCard } from '../../src/components/TrendChartCard';
import { createComponent } from '../helpers/renderHook';

// ─── react-native-gifted-charts Mock ─────────────────────────────────────────
jest.mock('react-native-gifted-charts', () => ({
  BarChart: () => null,
}));

// ─── useWeeklyRevenue Mock ───────────────────────────────────────────────────
jest.mock('../../src/hooks/useWeeklyRevenue', () => ({
  useWeeklyRevenue: jest.fn(),
}));

import { useWeeklyRevenue } from '../../src/hooks/useWeeklyRevenue';

const mockUseWeeklyRevenue = useWeeklyRevenue as jest.Mock;

describe('TrendChartCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('로딩 중일 때 로딩 스피너와 안내 문구를 렌더링한다', () => {
    mockUseWeeklyRevenue.mockReturnValue({
      chartData: [],
      loading: true,
      maxVal: 100,
    });

    const tree = createComponent(<TrendChartCard />);
    
    // ActivityIndicator 확인
    const spinners = tree.root.findAllByType(ActivityIndicator);
    expect(spinners.length).toBeGreaterThan(0);
    
    // 로딩 텍스트 확인
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('차트 데이터를 분석 중입니다...');
  });

  it('데이터가 비었을 때 빈 상태 안내 텍스트를 렌더링한다', () => {
    mockUseWeeklyRevenue.mockReturnValue({
      chartData: [{ value: 0 }, { value: 0 }],
      loading: false,
      maxVal: 100,
    });

    const tree = createComponent(<TrendChartCard />);
    
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('이번 주 첫 수입을 입력하면 그래프가 완성됩니다.');
  });

  it('데이터가 존재할 때 차트를 렌더링하며 빈 상태 텍스트를 렌더링하지 않는다', () => {
    mockUseWeeklyRevenue.mockReturnValue({
      chartData: [{ value: 50000 }, { value: 30000 }],
      loading: false,
      maxVal: 50000,
    });

    const tree = createComponent(<TrendChartCard />);
    
    // 로딩도 빈 상태 텍스트도 없어야 함
    const spinners = tree.root.findAllByType(ActivityIndicator);
    expect(spinners.length).toBe(0);

    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).not.toContain('이번 주 첫 수입을 입력하면 그래프가 완성됩니다.');
    expect(texts).not.toContain('차트 데이터를 분석 중입니다...');
  });
});
