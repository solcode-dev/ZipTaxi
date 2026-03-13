import type { ViewStyle, TextStyle } from 'react-native';

export const cardStyle: ViewStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

export const sectionLabelStyle: TextStyle = {
  fontSize: 11,
  color: '#BDBDBD',
  fontWeight: '600',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  marginBottom: 14,
};

export const COLORS = {
  profit:   '#3949AB',
  loss:     '#E53935',
  neutral:  '#9E9E9E',
  primary:  '#6C63FF',
  dark:     '#1A1A2E',
  surface:  '#F5F7FA',
  divider:  '#F0F0F0',
} as const;
