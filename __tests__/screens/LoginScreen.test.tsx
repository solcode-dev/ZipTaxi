import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';

// Mock Firebase Auth before importing components
jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    onAuthStateChanged: jest.fn(() => jest.fn()),
    currentUser: null,
  });
});

import {LoginScreen} from '../../src/screens/LoginScreen';
import {useAuthStore} from '../../src/state/authStore';

// Mock dependencies
jest.mock('../../src/state/authStore');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.login': 'Login',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.loginButton': 'Login',
        'auth.kakaoLogin': 'Login with Kakao',
        'auth.errors.auth/invalid-email': 'Invalid email address.',
        'auth.errors.auth/invalid-credential': 'Email or password is incorrect.',
        'auth.errors.default': 'An error occurred during login.',
      };
      return translations[key] || key;
    },
  }),
}));
jest.mock('react-native-paper', () => {
  const RealModule = jest.requireActual('react-native-paper');
  return {
    ...RealModule,
    useTheme: () => ({
      colors: {
        primary: '#6200ee',
      },
    }),
  };
});

describe('LoginScreen', () => {
  const mockLogin = jest.fn();
  const mockLoginWithKakao = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      loginWithKakao: mockLoginWithKakao,
      isLoading: false,
    });
  });

  it('should render login screen correctly', () => {
    const {getByText, getByTestId, getAllByText} = render(<LoginScreen />);

    expect(getByText('ZipTaxi')).toBeTruthy();
    expect(getAllByText('Login').length).toBeGreaterThan(0);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByTestId('kakao-login-button')).toBeTruthy();
  });

  it('should update email input when user types', () => {
    const {getByTestId} = render(<LoginScreen />);
    const emailInput = getByTestId('email-input');

    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should update password input when user types', () => {
    const {getByTestId} = render(<LoginScreen />);
    const passwordInput = getByTestId('password-input');

    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('should show error when email is invalid', async () => {
    const {getByTestId} = render(<LoginScreen />);
    const emailInput = getByTestId('email-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid email address.');
    });
  });

  it('should show error when password is too short', async () => {
    const {getByTestId} = render(<LoginScreen />);
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, '12345');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Password must be at least 6 characters',
      );
    });
  });

  it('should call login function with valid credentials', async () => {
    mockLogin.mockResolvedValue(undefined);
    const {getByTestId} = render(<LoginScreen />);
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show error alert when login fails', async () => {
    mockLogin.mockRejectedValue({
      code: 'auth/invalid-credential',
      message: 'Invalid credentials',
    });
    const {getByTestId} = render(<LoginScreen />);
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Email or password is incorrect.',
      );
    });
  });

  it('should call loginWithKakao when Kakao login button is pressed', async () => {
    mockLoginWithKakao.mockResolvedValue(undefined);
    const {getByTestId} = render(<LoginScreen />);
    const kakaoButton = getByTestId('kakao-login-button');

    fireEvent.press(kakaoButton);

    await waitFor(() => {
      expect(mockLoginWithKakao).toHaveBeenCalled();
    });
  });

  it('should show error alert when Kakao login fails', async () => {
    mockLoginWithKakao.mockRejectedValue({message: 'kakao/login-failed'});
    const {getByTestId} = render(<LoginScreen />);
    const kakaoButton = getByTestId('kakao-login-button');

    fireEvent.press(kakaoButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Kakao Login Failed',
        expect.any(String),
      );
    });
  });

  it('should disable inputs when loading', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      loginWithKakao: mockLoginWithKakao,
      isLoading: true,
    });

    const {getByTestId} = render(<LoginScreen />);
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');

    expect(emailInput.props.editable).toBe(false);
    expect(passwordInput.props.editable).toBe(false);
  });

  it('should show loading state on login button', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      loginWithKakao: mockLoginWithKakao,
      isLoading: true,
    });

    const {getByTestId} = render(<LoginScreen />);
    const loginButton = getByTestId('login-button');

    expect(loginButton.props.accessibilityState.disabled).toBe(true);
  });
});
