import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { DailyGoalResult } from '../hooks/useDailyGoalCalculator';
import { formatCurrency } from '../utils/formatUtils';

interface DailyGoalCardProps {
  data: DailyGoalResult;
  todayRevenue: number;
  onEditGoal: () => void;
}

export const DailyGoalCard = ({ data, todayRevenue, onEditGoal }: DailyGoalCardProps) => {
  const { dailyTarget, progressPercent, isBonusMode, bonusAmount, statusMessage } = data;

  const noGoal = dailyTarget === 0 && !isBonusMode;
  const month = new Date().getMonth() + 1;

  const cardStyle = isBonusMode ? styles.bonusCard : styles.normalCard;
  const progressColor = isBonusMode ? '#FFD700' : theme.colors.primary;
  const progressBackgroundColor = isBonusMode ? 'rgba(255, 215, 0, 0.2)' : '#E0E0E0';
  const visualProgress = Math.min(100, Math.max(0, progressPercent));
  const pctText = `${Math.round(progressPercent)}%`;

  const mainAmount = isBonusMode
    ? `+${formatCurrency(bonusAmount)}`
    : formatCurrency(dailyTarget);
  const mainUnit = isBonusMode ? '원 보너스!' : '원 목표';

  return (
    <View style={[styles.card, cardStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={isBonusMode ? styles.bonusLabel : styles.label}>🔥 오늘의 미션</Text>
        {!noGoal && (
          <Text style={[styles.pctText, isBonusMode && styles.bonusPctText]}>{pctText}</Text>
        )}
      </View>

      {/* Main Amount + current earned */}
      {!noGoal && (
        <View style={styles.mainContent}>
          <View style={styles.amountRow}>
            <Text style={styles.amountText}>{mainAmount}</Text>
            <Text style={styles.unitText}>{mainUnit}</Text>
          </View>
          {!isBonusMode && (
            <Text style={styles.currentText}>현재 {formatCurrency(todayRevenue)}원 달성</Text>
          )}
        </View>
      )}

      {/* Progress Bar */}
      {!noGoal && (
        <View style={[styles.progressBarBackground, { backgroundColor: progressBackgroundColor }]}>
          <View
            style={[styles.progressBarFill, { width: `${visualProgress}%`, backgroundColor: progressColor }]}
          />
        </View>
      )}

      {/* Message */}
      <Text style={styles.messageText}>{statusMessage}</Text>

      {/* 목표 미설정 시 카드 내부 CTA 버튼 */}
      {noGoal ? (
        <TouchableOpacity style={styles.ctaButton} onPress={onEditGoal}>
          <Text style={styles.ctaText}>{month}월 목표 세우기  +</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.editLink}
          onPress={onEditGoal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editLinkText}>목표 금액 바꾸기 ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  normalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  bonusCard: {
    backgroundColor: '#FFFBE6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  bonusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  pctText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  bonusPctText: {
    color: '#FF8C00',
  },
  mainContent: {
    marginBottom: 16,
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 36,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    lineHeight: 28,
  },
  currentText: {
    fontSize: 13,
    color: '#888888',
  },
  progressBarBackground: {
    height: 12,
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  messageText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 12,
  },
  editLink: {
    alignSelf: 'flex-end',
  },
  editLinkText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  ctaButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
