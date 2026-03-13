import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { cardStyle, sectionLabelStyle, COLORS } from './shared';

const MONTH_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function formatMan(value: number): string {
  if (value === 0)      return '';
  if (value >= 10000)   return `${Math.round(value / 10000)}만`;
  return `${Math.round(value / 1000)}천`;
}

interface Props {
  year: number;
  monthly: number[];
  currentMonth: number; // 1-indexed
  loading: boolean;
}

// ─── 안정적인 라벨 컴포넌트 분리 ──────────────────────────────
const BarTopLabel = ({ value }: { value: number }) => {
  return <Text style={styles.barTop}>{formatMan(value)}</Text>;
};

export const YearlyTrendCard = memo(({ year, monthly, currentMonth, loading }: Props) => {
  const { width: windowWidth } = useWindowDimensions();
  // 카드 padding 20×2 + 화면 padding 16×2
  const chartWidth = windowWidth - 72;

  // 12b + 11s = chartWidth, s = b/2 → b = chartWidth / 17.5
  const barWidth = chartWidth / 17.5;
  const spacing  = barWidth / 2;

  const max = Math.max(...monthly, 1);

  const data = useMemo(() => monthly.map((value, i) => ({
    value,
    label: MONTH_LABELS[i],
    frontColor: i === currentMonth - 1 ? COLORS.primary : `${COLORS.primary}55`,
    topLabelComponent: () => <BarTopLabel value={value} />,
  })), [monthly, currentMonth]);

  return (
    <View style={cardStyle}>
      <Text style={sectionLabelStyle}>연간 추이 ({year})</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <BarChart
          data={data}
          width={chartWidth}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={0}
          endSpacing={0}
          yAxisLabelWidth={0}
          isAnimated={false}
          disablePress
          hideRules
          hideAxesAndRules
          xAxisLabelTextStyle={styles.xLabel}
          topLabelContainerStyle={styles.barTopContainer}
          noOfSections={3}
          maxValue={max}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  loader: {
    paddingVertical: 40,
  },
  xLabel: {
    fontSize: 10,
    color: COLORS.neutral,
    textAlign: 'center',
  },
  barTopContainer: {
    marginBottom: 2,
  },
  barTop: {
    fontSize: 9,
    color: COLORS.neutral,
    textAlign: 'center',
  },
});
