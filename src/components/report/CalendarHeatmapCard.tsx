import React, { useMemo, useState, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { generateCalendarWeeks } from '../../utils/calendarUtils';
import { formatCurrency } from '../../utils/formatUtils';
import { cardStyle, sectionLabelStyle, COLORS } from './shared';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const CELL_GAP = 4;

interface Props {
  viewDate: Date;
  dailyRevenue: Record<string, number>;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function cellColor(amount: number, max: number): string {
  if (amount === 0) return COLORS.divider;
  const opacity = Math.max(0.15, amount / max);
  return `rgba(108, 99, 255, ${opacity.toFixed(2)})`;
}

export const CalendarHeatmapCard = memo(({ viewDate, dailyRevenue }: Props) => {
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const weeks = useMemo(() => generateCalendarWeeks(year, month), [year, month]);
  const max   = useMemo(() => Math.max(...Object.values(dailyRevenue), 1), [dailyRevenue]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedDate(null);
  }, [year, month]);

  const today    = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const handlePress = (dateStr: string, amount: number) => {
    if (amount === 0) return;
    setSelectedDate(prev => (prev === dateStr ? null : dateStr));
  };

  const selectedAmount = selectedDate ? (dailyRevenue[selectedDate] ?? 0) : null;

  return (
    <View style={cardStyle}>
      <Text style={sectionLabelStyle}>수입 캘린더</Text>

      {/* 요일 헤더 */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map(d => (
          <Text key={d} style={styles.weekdayLabel}>{d}</Text>
        ))}
      </View>

      {/* 날짜 그리드 */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.emptyCell} />;
            const dateStr    = toDateStr(year, month, day);
            const amount     = dailyRevenue[dateStr] ?? 0;
            const isToday    = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <TouchableOpacity
                key={di}
                activeOpacity={amount > 0 ? 0.7 : 1}
                onPress={() => handlePress(dateStr, amount)}
                style={[
                  styles.dayCell,
                  { backgroundColor: cellColor(amount, max) },
                  isToday    && styles.todayBorder,
                  isSelected && styles.selectedBorder,
                ]}
              >
                <Text style={[styles.dayNumber, amount > 0 && styles.dayNumberActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* 선택된 날짜 수입 / 기본 범례 */}
      {selectedDate && selectedAmount !== null ? (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedDate}>
            {selectedDate.slice(5).replace('-', '월 ')}일
          </Text>
          <Text style={styles.selectedAmount}>{formatCurrency(selectedAmount)}원</Text>
        </View>
      ) : (
        <View style={styles.legend}>
          <Text style={styles.legendText}>적음</Text>
          {[0.15, 0.4, 0.65, 0.9].map(op => (
            <View key={op} style={[styles.legendDot, { backgroundColor: `rgba(108, 99, 255, ${op})` }]} />
          ))}
          <Text style={styles.legendText}>많음</Text>
          {Object.keys(dailyRevenue).length > 0 && (
            <Text style={styles.legendMax}>최고 {formatCurrency(max)}원</Text>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: CELL_GAP,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.neutral,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: CELL_GAP,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCell: {
    flex: 1,
    aspectRatio: 1,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  dayNumber: {
    fontSize: 12,
    color: COLORS.neutral,
    fontWeight: '500',
  },
  dayNumberActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
    paddingVertical: 10,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 8,
  },
  selectedDate: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.neutral,
    marginHorizontal: 2,
  },
  legendMax: {
    fontSize: 10,
    color: COLORS.neutral,
    marginLeft: 'auto',
  },
});
