import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { DashboardHeader } from '../components/DashboardHeader';

import { DashboardProvider } from '../context/DashboardContext';
import { TodayScreen }      from '../screens/dashboard/TodayScreen';
import { MonthScreen }      from '../screens/dashboard/MonthScreen';
import { EfficiencyScreen } from '../screens/dashboard/EfficiencyScreen';
import type { DashboardTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<DashboardTabParamList>();

const TAB_CONFIG = [
  { name: 'Today'      as const, component: TodayScreen,      label: '오늘',    icon: '🏠' },
  { name: 'Month'      as const, component: MonthScreen,      label: '이번달',  icon: '📊' },
  { name: 'Efficiency' as const, component: EfficiencyScreen, label: '운행효율', icon: '🚗' },
];

export const DashboardTabNavigator = () => (
  <DashboardProvider>
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
  </DashboardProvider>
);
