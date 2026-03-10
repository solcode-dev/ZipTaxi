import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';

import { useDashboard } from '../../context/DashboardContext';
import { DrivingInputModal } from '../../components/DrivingInputModal';
import { CustomAlert } from '../../components/CustomAlert';
import { formatCurrency } from '../../utils/formatUtils';
import { theme } from '../../theme';

export const EfficiencyScreen = () => {
  const {
    perHour, perKm,
    monthlyDrivingMinutes, monthlyDistanceKm,
    addDrivingSession,
  } = useDashboard();

  const [drivingModalVisible, setDrivingModalVisible] = useState(false);
  const [alertVisible,        setAlertVisible]        = useState(false);

  const handleDrivingConfirm = async (minutes: number, distanceKm: number) => {
    if (!await addDrivingSession(minutes, distanceKm)) {
      setAlertVisible(true);
    }
  };

  const drivingHours = Math.floor(monthlyDrivingMinutes / 60);
  const drivingMins  = monthlyDrivingMinutes % 60;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 시간당 순수익 */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>⏱ 시간당 순수익</Text>
          <Text style={styles.mainValue}>
            {perHour !== null ? `${formatCurrency(perHour)} 원` : '--'}
          </Text>
          <Text style={styles.subText}>
            {monthlyDrivingMinutes > 0
              ? `이달 운행 ${drivingHours}h ${drivingMins}m`
              : '운행 기록 없음'}
          </Text>
        </View>

        {/* km당 순수익 */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📍 km당 순수익</Text>
          <Text style={styles.mainValue}>
            {perKm !== null ? `${formatCurrency(perKm)} 원/km` : '--'}
          </Text>
          <Text style={styles.subText}>
            {monthlyDistanceKm > 0
              ? `이달 운행 ${monthlyDistanceKm} km`
              : '운행 기록 없음'}
          </Text>
        </View>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setDrivingModalVisible(true)}>
        <Text style={styles.fabText}>+ 운행 기록</Text>
      </TouchableOpacity>

      <DrivingInputModal
        visible={drivingModalVisible}
        onClose={() => setDrivingModalVisible(false)}
        onConfirm={handleDrivingConfirm}
      />
      <CustomAlert
        visible={alertVisible}
        title="오류"
        message="운행 기록 저장에 실패했습니다."
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
  },
  mainValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
