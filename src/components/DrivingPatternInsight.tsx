import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  drivingMinutes: number;
  distanceKm: number;
}

type Pattern = 'city' | 'mixed' | 'highway';

interface PatternConfig {
  icon: string;
  label: string;
  hint: string;
  color: string;
  bg: string;
}

const PATTERN_CONFIG: Record<Pattern, PatternConfig> = {
  city: {
    icon: '🏙',
    label: '단거리 시내형',
    hint: '장거리 콜을 늘리면 km당 효율을 높일 수 있어요',
    color: '#F39C12',
    bg: '#FFF8EE',
  },
  mixed: {
    icon: '🔀',
    label: '혼합형',
    hint: '시내·장거리 균형이 잘 잡혀 있어요',
    color: '#3498DB',
    bg: '#EEF5FF',
  },
  highway: {
    icon: '🛣',
    label: '장거리 고속형',
    hint: '시내 단거리 콜을 섞으면 시간당 효율을 높일 수 있어요',
    color: '#27AE60',
    bg: '#EEFAF3',
  },
};

function classifyPattern(avgSpeedKmh: number): Pattern {
  if (avgSpeedKmh < 25) return 'city';
  if (avgSpeedKmh < 45) return 'mixed';
  return 'highway';
}

export const DrivingPatternInsight = ({ drivingMinutes, distanceKm }: Props) => {
  if (drivingMinutes === 0 || distanceKm === 0) return null;

  const avgSpeed = distanceKm / (drivingMinutes / 60);
  const pattern  = classifyPattern(avgSpeed);
  const config   = PATTERN_CONFIG[pattern];

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <View style={styles.body}>
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.hint}>{config.hint}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
