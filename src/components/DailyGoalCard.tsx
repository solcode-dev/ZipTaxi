import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { DailyGoalResult } from '../hooks/useDailyGoalCalculator';

interface DailyGoalCardProps {
  data: DailyGoalResult;
}

export const DailyGoalCard = (props: DailyGoalCardProps) => {
  const { data } = props;
  const {
    dailyTarget,
    progressPercent,
    isBonusMode,
    bonusAmount,
    statusMessage
  } = data;

  // Decide styles based on mode
  const cardStyle = isBonusMode ? styles.bonusCard : styles.normalCard;
  const progressColor = isBonusMode ? '#FFD700' : theme.colors.primary; // Gold or Primary
  const progressBackgroundColor = isBonusMode ? 'rgba(255, 215, 0, 0.2)' : '#E0E0E0';
  
  // Cap progress bar at 100% for visual sanity (unless we want it to overflow, but 100% is full)
  // For bonus mode, maybe full bar is better or pulsing? Let's keep it full (100%) if bonus.
  const visualProgress = Math.min(100, Math.max(0, progressPercent));

  return (
    <View style={[styles.card, cardStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={isBonusMode ? styles.bonusLabel : styles.label}>🔥 오늘의 미션</Text>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {/* History Button (New) */}


          {/* Goal Setting Button */}
          <View style={styles.settingButton}>
            <Text style={styles.settingButtonText}>목표 수정 ✎</Text>
          </View>
        </View>
      </View>

      {/* Main Amount */}
      <View style={styles.mainContent}>
        <Text style={styles.amountText}>
          {isBonusMode 
            ? `+${bonusAmount.toLocaleString()}` 
            : dailyTarget.toLocaleString()}
          <Text style={styles.unitText}>{isBonusMode ? '원 보너스!' : '원 목표'}</Text>
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarBackground, { backgroundColor: progressBackgroundColor }]}>
        <View 
          style={[
            styles.progressBarFill, 
            { 
              width: `${visualProgress}%`, 
              backgroundColor: progressColor 
            }
          ]} 
        />
      </View>

      {/* Message */}
      <Text style={styles.messageText}>{statusMessage}</Text>
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
    backgroundColor: '#FFFBE6', // Very light gold/yellow
    borderWidth: 2,
    borderColor: '#FFD700', // Gold border
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
    color: '#FF8C00', // Dark Orange/Gold
  },
  badge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  mainContent: {
    marginBottom: 16,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  unitText: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#666666',
    marginLeft: 4,
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
    textAlign: 'center',
  },
  settingButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  settingButtonText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: '#FFE812', // Kakao Yellow for visibility
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyButtonText: {
    fontSize: 12,
    color: '#3C1E1E',
    fontWeight: 'bold',
  },
});
