import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { theme } from '../theme';
import { useWeeklyRevenue } from '../hooks/useWeeklyRevenue';

/**
 * [주간 수입 트렌드 차트 카드]
 * 이번 주의 요일별 수입 변화를 막대 그래프로 보여줍니다.
 * 실제 Firestore 데이터를 기반으로 수치와 그래프가 실시간 업데이트됩니다.
 */
export const TrendChartCard = () => {
  // 실데이터를 가져오는 커스텀 훅 사용
  const { chartData, loading, maxVal } = useWeeklyRevenue();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 주간 수입/지출 비교</Text>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>수입</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.expenseDot]} />
            <Text style={styles.legendText}>지출</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {loading ? (
          // 데이터 로딩 중 표시
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>차트 데이터를 분석 중입니다...</Text>
          </View>
        ) : (
          // 실제 막대 그래프 렌더링
          <BarChart
            data={chartData}
            barWidth={12}
            spacing={24}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={1}
            yAxisThickness={0}
            yAxisTextStyle={styles.yAxisText}
            noOfSections={4}
            maxValue={maxVal} // 데이터에 따른 가변 높이 세팅
            height={180}
            width={280}
          />
        )}
      </View>

      <Text style={styles.insightText}>
        {loading ? '데이터를 집계하고 있습니다.' : 
         chartData.some(d => d.value > 0) 
         ? '💡 이번 주는 운행 성과가 실시간으로 반영되고 있습니다!' 
         : '💡 이번 주 첫 수입을 입력하고 그래프를 완성해보세요!'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  legendContainer: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  expenseDot: {
    backgroundColor: '#FF6B6B',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 180,
  },
  // 로딩 상태 스타일
  loadingWrapper: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  insightText: {
    fontSize: 14,
    color: '#555',
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  yAxisText: {
    color: '#999',
    fontSize: 10,
  }
});
