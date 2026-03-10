
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen }           from '@screens/LoginScreen';
import { SignupScreen }          from '../screens/SignupScreen';
import { GoalSettingScreen }     from '../screens/GoalSettingScreen';
import { MonthlyReportScreen }   from '../screens/MonthlyReportScreen';
import { DashboardTabNavigator } from './DashboardTabNavigator';

import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Signup"   component={SignupScreen}
        options={{ headerShown: true, title: '회원가입', headerBackTitle: '뒤로' }} />
      <Stack.Screen name="Dashboard" component={DashboardTabNavigator} />
      <Stack.Screen name="GoalSetting" component={GoalSettingScreen}
        options={{ headerShown: true, title: '목표 설정', headerBackTitle: '뒤로' }} />
      <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen}
        options={{ headerShown: true, title: '월간 리포트', headerBackTitle: '뒤로' }} />
    </Stack.Navigator>
  </NavigationContainer>
);
