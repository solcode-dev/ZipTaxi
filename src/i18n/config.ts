import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

const resources = {
  ko: {
    translation: {
      auth: {
        login: '로그인',
        email: '이메일',
        password: '비밀번호',
        loginButton: '로그인',
        kakaoLogin: '카카오 로그인',
        errors: {
          'auth/invalid-email': '유효하지 않은 이메일 주소입니다.',
          'auth/user-disabled': '비활성화된 계정입니다.',
          'auth/user-not-found': '사용자를 찾을 수 없습니다.',
          'auth/wrong-password': '잘못된 비밀번호입니다.',
          'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
          'auth/too-many-requests': '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
          'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
          'password-too-short': '비밀번호는 최소 6자 이상이어야 합니다.',
          'kakao/login-failed': '카카오 로그인에 실패했습니다.',
          'kakao/cancelled': '카카오 로그인이 취소되었습니다.',
          'kakao/token-exchange-failed': '카카오 토큰 교환에 실패했습니다.',
          default: '로그인 중 오류가 발생했습니다.',
        },
      },
    },
  },
  en: {
    translation: {
      auth: {
        login: 'Login',
        email: 'Email',
        password: 'Password',
        loginButton: 'Login',
        kakaoLogin: 'Login with Kakao',
        errors: {
          'auth/invalid-email': 'Invalid email address.',
          'auth/user-disabled': 'This account has been disabled.',
          'auth/user-not-found': 'User not found.',
          'auth/wrong-password': 'Incorrect password.',
          'auth/invalid-credential': 'Email or password is incorrect.',
          'auth/too-many-requests': 'Too many login attempts. Please try again later.',
          'auth/network-request-failed': 'Please check your network connection.',
          'password-too-short': 'Password must be at least 6 characters.',
          'kakao/login-failed': 'Kakao login failed.',
          'kakao/cancelled': 'Kakao login was cancelled.',
          'kakao/token-exchange-failed': 'Failed to exchange Kakao token.',
          default: 'An error occurred during login.',
        },
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ko',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
