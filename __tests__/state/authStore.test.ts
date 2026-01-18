import {renderHook, act, waitFor} from '@testing-library/react-native';
import {useAuthStore} from '../../src/state/authStore';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
import {KakaoAuthService} from '../../src/services/kakaoAuth';

// Mock services
jest.mock('../../src/services/firebaseAuth');
jest.mock('../../src/services/kakaoAuth');
jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    onAuthStateChanged: jest.fn(() => jest.fn()),
  });
});

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  describe('setUser', () => {
    it('should set user and update authentication state', () => {
      const {result} = renderHook(() => useAuthStore());
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear user and update authentication state when null', () => {
      const {result} = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const {result} = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login with email and password', async () => {
      const {result} = renderHook(() => useAuthStore());
      (FirebaseAuthService.loginWithEmail as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(FirebaseAuthService.loginWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should handle login errors', async () => {
      const {result} = renderHook(() => useAuthStore());
      const mockError = {code: 'auth/invalid-credential', message: 'Invalid credentials'};
      (FirebaseAuthService.loginWithEmail as jest.Mock).mockRejectedValue(mockError);

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword');
        }),
      ).rejects.toEqual(mockError);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('loginWithKakao', () => {
    it('should successfully login with Kakao', async () => {
      const {result} = renderHook(() => useAuthStore());
      const mockKakaoResult = {
        accessToken: 'kakao-token',
        refreshToken: 'kakao-refresh',
      };
      const mockProfile = {
        id: '12345',
        email: 'kakao@example.com',
        nickname: 'Kakao User',
        profileImageUrl: 'https://example.com/profile.jpg',
      };

      (KakaoAuthService.login as jest.Mock).mockResolvedValue(mockKakaoResult);
      (KakaoAuthService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      await act(async () => {
        await result.current.loginWithKakao();
      });

      expect(KakaoAuthService.login).toHaveBeenCalled();
      expect(KakaoAuthService.getProfile).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(result.current.user).toMatchObject({
          uid: '12345',
          email: 'kakao@example.com',
          displayName: 'Kakao User',
        });
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should handle Kakao login cancellation', async () => {
      const {result} = renderHook(() => useAuthStore());
      (KakaoAuthService.login as jest.Mock).mockRejectedValue(
        new Error('kakao/cancelled'),
      );

      await expect(
        act(async () => {
          await result.current.loginWithKakao();
        }),
      ).rejects.toThrow('kakao/cancelled');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle Kakao login errors', async () => {
      const {result} = renderHook(() => useAuthStore());
      (KakaoAuthService.login as jest.Mock).mockRejectedValue(
        new Error('kakao/login-failed'),
      );

      await expect(
        act(async () => {
          await result.current.loginWithKakao();
        }),
      ).rejects.toThrow('kakao/login-failed');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const {result} = renderHook(() => useAuthStore());
      (FirebaseAuthService.logout as jest.Mock).mockResolvedValue(undefined);
      (KakaoAuthService.logout as jest.Mock).mockResolvedValue(undefined);

      // Set a user first
      act(() => {
        result.current.setUser({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(FirebaseAuthService.logout).toHaveBeenCalled();
      expect(KakaoAuthService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle logout errors', async () => {
      const {result} = renderHook(() => useAuthStore());
      const mockError = new Error('Logout failed');
      (FirebaseAuthService.logout as jest.Mock).mockRejectedValue(mockError);

      await expect(
        act(async () => {
          await result.current.logout();
        }),
      ).rejects.toThrow('Logout failed');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
