/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock dependencies before importing App
jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    onAuthStateChanged: jest.fn(() => jest.fn()),
    currentUser: null,
  });
});

jest.mock('../src/state/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: jest.fn(),
    loginWithKakao: jest.fn(),
    logout: jest.fn(),
    setUser: jest.fn(),
    setLoading: jest.fn(),
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn(),
}));

jest.mock('react-native-paper', () => {
  const RealModule = jest.requireActual('react-native-paper');
  return {
    ...RealModule,
    PaperProvider: ({children}: any) => children,
    useTheme: () => ({
      colors: {
        primary: '#6200ee',
      },
    }),
  };
});

// Import App after mocking
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
