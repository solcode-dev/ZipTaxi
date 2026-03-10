import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { firebaseAuth } from '../lib/firebase';
import { useDashboard } from '../context/DashboardContext';
import { SettingsModal } from './SettingsModal';
import { CustomAlert } from './CustomAlert';
import type { RootStackParamList } from '../types/navigation';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function getGreeting(userName: string): string {
  const hour = new Date().getHours();
  const name = userName || '기사님';
  if (hour < 6)  return `새벽 운행 중이시군요, ${name}. 안전 최우선! 🌙`;
  if (hour < 12) return `좋은 아침이에요, ${name}! 오늘도 파이팅 💪`;
  if (hour < 18) return `오후도 힘내세요, ${name}!`;
  return `오늘 수고 많으셨어요, ${name} 🙌`;
}

export const DashboardHeader = () => {
  const navigation = useNavigation<RootNav>();
  const { userName, streakData } = useDashboard();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [alertVisible,    setAlertVisible]    = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const prevFreezeRef = useRef(streakData.freezeCount);
  useEffect(() => {
    if (streakData.freezeCount > prevFreezeRef.current) {
      const added = streakData.freezeCount - prevFreezeRef.current;
      showAlert('축하합니다! 🎉', `7일 연속 달성 보상으로\n휴무권 ${added}개를 획득하셨습니다! 🛡️`);
    }
    prevFreezeRef.current = streakData.freezeCount;
  }, [streakData.freezeCount]);

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      navigation.replace('Login');
    } catch {
      showAlert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

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

      {/* 우측: 설정 버튼만 */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setSettingsVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="settings-outline" size={22} color="#666" />
      </TouchableOpacity>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onLogout={handleLogout}
      />
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
