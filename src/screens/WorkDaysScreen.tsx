import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { theme } from '../theme';
import { useWorkDays, type WorkDayPreset } from '../hooks/useWorkDays';
import { generateCalendarWeeks } from '../utils/calendarUtils';
import { CustomAlert } from '../components/CustomAlert';
import type { WorkDaysScreenProps } from '../types/navigation';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const PRESETS: { key: Exclude<WorkDayPreset, 'custom'>; label: string }[] = [
  { key: 'weekday', label: '평일만 (월~금)' },
  { key: 'sixDay',  label: '주 6일 (월~토)' },
  { key: 'allDay',  label: '매일' },
];

export const WorkDaysScreen = ({ navigation, route }: WorkDaysScreenProps) => {
  const { year, month, initialDays } = route.params;

  const { selectedDays, preset, toggleDay, applyPreset, save, workDayCount, remainingWorkDays } =
    useWorkDays(year, month, initialDays);

  const weeks = generateCalendarWeeks(year, month);

  const today = new Date();
  const todayDate =
    year === today.getFullYear() && month === today.getMonth() + 1
      ? today.getDate()
      : -1;

  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string) =>
    setAlertConfig({ visible: true, title, message });

  const handleSave = async () => {
    setSaving(true);
    try {
      await save();
      navigation.goBack();
    } catch {
      setSaving(false);
      showAlert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 안내 문구 */}
        <Text style={styles.subtitle}>{month}월에 일할 날짜를 선택해주세요</Text>

        {/* 프리셋 칩 */}
        <View style={styles.chipRow}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.chip, preset === p.key && styles.chipActive]}
              onPress={() => applyPreset(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, preset === p.key && styles.chipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 달력 */}
        <View style={styles.calendar}>
          {/* 요일 헤더 */}
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((label, i) => (
              <Text
                key={label}
                style={[
                  styles.weekLabel,
                  i === 0 && styles.sundayLabel,
                  i === 6 && styles.saturdayLabel,
                ]}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                if (day === null) return <View key={di} style={styles.dayCell} />;

                const isSelected = selectedDays.has(day);
                const isToday    = day === todayDate;
                const isPast     = todayDate > 0 && day < todayDate;
                const isSunday   = di === 0;
                const isSaturday = di === 6;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      isSelected && styles.daySelected,
                      isToday && !isSelected && styles.dayToday,
                    ]}
                    onPress={() => toggleDay(day)}
                    activeOpacity={0.65}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        !isSelected && isSunday && styles.sundayText,
                        !isSelected && isSaturday && styles.saturdayText,
                        isPast && !isSelected && styles.dayTextPast,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>이번 달 근무일</Text>
            <Text style={styles.summaryValue}>{workDayCount}일</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <Text style={styles.summaryLabel}>오늘 이후 남은 근무일</Text>
            <Text style={[styles.summaryValue, styles.summaryHighlight]}>{remainingWorkDays}일</Text>
          </View>
          <Text style={styles.summaryNote}>
            남은 근무일 기준으로 오늘의 목표 금액이 계산됩니다.
          </Text>
        </View>

      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>저장하기</Text>
          )}
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(c => ({ ...c, visible: false }))}
      />
    </SafeAreaView>
  );
};

const CELL_SIZE = 40;
const PRIMARY = theme.colors.primary;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scroll: {
    padding: 20,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },

  // ─── Preset chips ────────────────────────────────────────────────────────────
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  chipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // ─── Calendar ────────────────────────────────────────────────────────────────
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    paddingVertical: 4,
  },
  sundayLabel: {
    color: '#F44336',
  },
  saturdayLabel: {
    color: '#1565C0',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: PRIMARY,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextPast: {
    color: '#CCCCCC',
  },
  sundayText: {
    color: '#F44336',
  },
  saturdayText: {
    color: '#1565C0',
  },

  // ─── Summary card ─────────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  summaryHighlight: {
    color: PRIMARY,
  },
  summaryNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#AAA',
    lineHeight: 18,
  },

  // ─── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    padding: 20,
    paddingBottom: 28,
    backgroundColor: '#F5F7FA',
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
