import {KakaoAuthService} from '../../src/services/kakaoAuth';
import * as KakaoLogin from '@react-native-seoul/kakao-login';

// Mock Kakao Login
jest.mock('@react-native-seoul/kakao-login', () => ({
  login: jest.fn(),
  getProfile: jest.fn(),
  logout: jest.fn(),
}));

describe('KakaoAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with Kakao', async () => {
      const mockLoginResult = {
        accessToken: 'kakao-access-token',
        refreshToken: 'kakao-refresh-token',
      };
      (KakaoLogin.login as jest.Mock).mockResolvedValue(mockLoginResult);

      const result = await KakaoAuthService.login();

      expect(result).toEqual({
        accessToken: 'kakao-access-token',
        refreshToken: 'kakao-refresh-token',
      });
      expect(KakaoLogin.login).toHaveBeenCalled();
    });

    it('should throw error when user cancels login', async () => {
      (KakaoLogin.login as jest.Mock).mockRejectedValue({code: 'E_CANCELLED'});

      await expect(KakaoAuthService.login()).rejects.toThrow('kakao/cancelled');
    });

    it('should throw error when login fails', async () => {
      (KakaoLogin.login as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(KakaoAuthService.login()).rejects.toThrow('kakao/login-failed');
    });
  });

  describe('getProfile', () => {
    it('should successfully fetch user profile', async () => {
      const mockProfile = {
        id: '12345',
        email: 'test@kakao.com',
        nickname: 'Test User',
        profileImageUrl: 'https://example.com/profile.jpg',
      };
      (KakaoLogin.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const result = await KakaoAuthService.getProfile();

      expect(result).toEqual({
        id: '12345',
        email: 'test@kakao.com',
        nickname: 'Test User',
        profileImageUrl: 'https://example.com/profile.jpg',
      });
      expect(KakaoLogin.getProfile).toHaveBeenCalled();
    });

    it('should throw error when profile fetch fails', async () => {
      (KakaoLogin.getProfile as jest.Mock).mockRejectedValue(new Error('Failed to fetch profile'));

      await expect(KakaoAuthService.getProfile()).rejects.toThrow('kakao/profile-fetch-failed');
    });
  });

  describe('logout', () => {
    it('should successfully logout from Kakao', async () => {
      (KakaoLogin.logout as jest.Mock).mockResolvedValue(undefined);

      await expect(KakaoAuthService.logout()).resolves.not.toThrow();
      expect(KakaoLogin.logout).toHaveBeenCalled();
    });

    it('should not throw error even if logout fails', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      (KakaoLogin.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      await expect(KakaoAuthService.logout()).resolves.not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });
});
