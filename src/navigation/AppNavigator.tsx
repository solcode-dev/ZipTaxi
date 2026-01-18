
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@screens/LoginScreen';
import { DashboardScreen } from '@screens/DashboardScreen';

import { SignupScreen } from '../screens/SignupScreen';

import { GoalSettingScreen } from '../screens/GoalSettingScreen';

// Define types for navigation
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Signup: undefined;
  GoalSetting: { initialGoal: number } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
            headerShown: false, // We will use custom headers or no headers for a cleaner look
            animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: true, title: '회원가입', headerBackTitle: '뒤로'}} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} /> 
        <Stack.Screen name="GoalSetting" component={GoalSettingScreen} options={{ headerShown: true, title: '목표 설정', headerBackTitle: '뒤로' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
