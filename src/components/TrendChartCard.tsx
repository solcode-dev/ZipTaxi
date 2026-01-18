import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { theme } from '../theme';

// Mock Data for Weekly Trend (Revenue vs Expense)
const weeklyData = [
  { value: 250000, label: '월', frontColor: theme.colors.primary, spacing: 2, labelTextStyle: { color: '#666' } },
  { value: 50000, frontColor: '#FF6B6B' }, // Expense

  { value: 320000, label: '화', frontColor: theme.colors.primary, spacing: 2, labelTextStyle: { color: '#666' } },
  { value: 80000, frontColor: '#FF6B6B' },

  { value: 210000, label: '수', frontColor: theme.colors.primary, spacing: 2, labelTextStyle: { color: '#666' } },
  { value: 40000, frontColor: '#FF6B6B' },

  { value: 380000, label: '목', frontColor: theme.colors.primary, spacing: 2, labelTextStyle: { color: '#666' } },
  { value: 120000, frontColor: '#FF6B6B' },

  { value: 450000, label: '금', frontColor: theme.colors.primary, spacing: 2, labelTextStyle: { color: '#666' } },
  { value: 90000, frontColor: '#FF6B6B' },

  { value: 520000, label: '토', frontColor: theme.colors.primary, spacing: 2, labelTextStyle: { color: '#666' } },
  { value: 100000, frontColor: '#FF6B6B' },

  { value: 150000, label: '일', frontColor: theme.colors.primary, spacing: 2, labelTextStyle: { color: '#666' } },
  { value: 30000, frontColor: '#FF6B6B' },
];

export const TrendChartCard = () => {
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
            <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>지출</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <BarChart
          data={weeklyData}
          barWidth={12}
          spacing={24}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={1}
          yAxisThickness={0}
          yAxisTextStyle={{ color: '#999', fontSize: 10 }}
          noOfSections={4}
          maxValue={600000}
          height={180}
          width={280} // Adjust based on screen width if needed
        />
      </View>

      <Text style={styles.insightText}>
        💡 이번 주는 <Text style={{fontWeight: 'bold'}}>금요일</Text> 순수익이 가장 좋네요!
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
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  insightText: {
    fontSize: 14,
    color: '#555',
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
});
