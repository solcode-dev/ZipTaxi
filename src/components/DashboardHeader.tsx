import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useDashboard } from '../context/DashboardContext';
import { CustomAlert } from './CustomAlert';

function getGreeting(userName: string): string {
  const hour = new Date().getHours();
  const name = userName || '사장님';
  if (hour < 6)  return `새벽 운행 중이시군요, ${name}. 안전 최우선! 🌙`;
  if (hour < 12) return `좋은 아침이에요, ${name}! 오늘도 파이팅 💪`;
  if (hour < 18) return `오후도 힘내세요, ${name}!`;
  return `오늘 수고 많으셨어요, ${name} 🙌`;
}

export const DashboardHeader = () => {
  const { userName, streakData, openSettings } = useDashboard();

  const [alertVisible,  setAlertVisible]  = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const prevFreezeRef = useRef(streakData.freezeCount);
  useEffect(() => {
    if (streakData.freezeCount > prevFreezeRef.current) {
      const added = streakData.freezeCount - prevFreezeRef.current;
      setAlertConfig({ title: '축하합니다! 🎉', message: `7일 연속 달성 보상으로\n휴무권 ${added}개를 획득하셨습니다! 🛡️` });
      setAlertVisible(true);
    }
    prevFreezeRef.current = streakData.freezeCount;
  }, [streakData.freezeCount]);

  return (
    <View style={styles.header}>
      {/* 좌측: 앱명 + 인사말 + 스트릭 */}
      <View style={styles.left}>
        <Text style={styles.title}>ZipTaxi</Text>
        <Text style={styles.greeting}>{getGreeting(userName)}</Text>
        {streakData.currentStreak > 0 && (
          <Text style={styles.streak}>🔥 {streakData.currentStreak}일 연속</Text>
        )}
      </View>

      {/* 우측: 설정 버튼 */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={openSettings}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="settings-outline" size={22} color="#666" />
      </TouchableOpacity>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  left: {
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  greeting: {
    fontSize: 13,
    color: '#666',
  },
  streak: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  settingsButton: {
    padding: 6,
  },
});
