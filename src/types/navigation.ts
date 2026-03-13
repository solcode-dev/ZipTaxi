import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Signup: undefined;
  GoalSetting: { initialGoal: number; initialWorkDays?: number[] } | undefined;
  MonthlyReport: undefined;
  WorkDays: { year: number; month: number; initialDays?: number[] };
};

export type DashboardTabParamList = {
  Today: undefined;
  Month: undefined;
};

export type LoginScreenProps       = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type SignupScreenProps       = NativeStackScreenProps<RootStackParamList, 'Signup'>;
export type DashboardScreenProps    = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
export type GoalSettingScreenProps  = NativeStackScreenProps<RootStackParamList, 'GoalSetting'>;
export type MonthlyReportScreenProps = NativeStackScreenProps<RootStackParamList, 'MonthlyReport'>;
export type WorkDaysScreenProps      = NativeStackScreenProps<RootStackParamList, 'WorkDays'>;

export type TodayScreenProps = BottomTabScreenProps<DashboardTabParamList, 'Today'>;
export type MonthScreenProps = BottomTabScreenProps<DashboardTabParamList, 'Month'>;
