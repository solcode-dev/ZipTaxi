import {login, getProfile, logout} from '@react-native-seoul/kakao-login';
import {KakaoProfile, KakaoLoginResult} from '../types/auth';

export class KakaoAuthService {
  /**
   * Login with Kakao
   */
  static async login(): Promise<KakaoLoginResult> {
    try {
      const result = await login();
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error: any) {
      if (error.code === 'E_CANCELLED') {
        throw new Error('kakao/cancelled');
      }
      throw new Error('kakao/login-failed');
    }
  }

  /**
   * Get Kakao user profile
   */
  static async getProfile(): Promise<KakaoProfile> {
    try {
      const profile = await getProfile();
      return {
        id: profile.id,
        email: profile.email,
        nickname: profile.nickname,
        profileImageUrl: profile.profileImageUrl,
      };
    } catch {
      throw new Error('kakao/profile-fetch-failed');
    }
  }

  /**
   * Logout from Kakao
   */
  static async logout(): Promise<void> {
    try {
      await logout();
    } catch (error: any) {
      // Log the error type but don't throw - logout should always succeed from app perspective
      if (__DEV__) {
        console.warn('Kakao logout failed:', error?.message || error);
      }
    }
  }
}
