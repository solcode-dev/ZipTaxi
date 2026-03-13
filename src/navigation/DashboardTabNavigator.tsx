import React from 'react';
import { View, Alert, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DashboardHeader } from '../components/DashboardHeader';
import { SettingsModal } from '../components/SettingsModal';

import { DashboardProvider } from '../context/DashboardContext';
import { useDashboard } from '../context/DashboardContext';
import { firebaseAuth } from '../lib/firebase';
import { TodayScreen }      from '../screens/dashboard/TodayScreen';
import { MonthScreen }      from '../screens/dashboard/MonthScreen';
import type { DashboardTabParamList, RootStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<DashboardTabParamList>();

const TAB_CONFIG = [
  { name: 'Today' as const, component: TodayScreen, label: '오늘',   icon: '🏠' },
  { name: 'Month' as const, component: MonthScreen, label: '이번달', icon: '📊' },
];

const DashboardTabsContent = () => {
  const { settingsVisible, closeSettings } = useDashboard();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      navigation.replace('Login');
    } catch {
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TAB_CONFIG.find(t => t.name === route.name)!;
          return {
            header: () => <DashboardHeader />,
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{tab.icon}</Text>
            ),
            tabBarActiveTintColor: '#FFC107',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#EEEEEE',
              paddingBottom: 4,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          };
        }}
      >
        {TAB_CONFIG.map(({ name, component }) => (
          <Tab.Screen key={name} name={name} component={component} />
        ))}
      </Tab.Navigator>

      {/* View 기반 overlay: 네비게이션 헤더는 덮지 않고 콘텐츠 영역만 dim */}
      <SettingsModal
        visible={settingsVisible}
        onClose={closeSettings}
        onLogout={handleLogout}
      />
    </View>
  );
};

export const DashboardTabNavigator = () => (
  <DashboardProvider>
    <DashboardTabsContent />
  </DashboardProvider>
);
