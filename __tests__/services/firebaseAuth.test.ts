import {FirebaseAuthService} from '../../src/services/firebaseAuth';
import auth from '@react-native-firebase/auth';

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => {
  const mockAuth = {
    signInWithEmailAndPassword: jest.fn(),
    signInWithCustomToken: jest.fn(),
    signOut: jest.fn(),
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  };
  return () => mockAuth;
});

describe('FirebaseAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginWithEmail', () => {
    it('should successfully login with valid credentials', async () => {
      const mockSignIn = auth().signInWithEmailAndPassword as jest.Mock;
      mockSignIn.mockResolvedValue({user: {uid: 'test-uid'}});

      await FirebaseAuthService.loginWithEmail('test@example.com', 'password123');

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should throw error with invalid credentials', async () => {
      const mockSignIn = auth().signInWithEmailAndPassword as jest.Mock;
      mockSignIn.mockRejectedValue({
        code: 'auth/invalid-credential',
        message: 'Invalid credentials',
      });

      await expect(
        FirebaseAuthService.loginWithEmail('test@example.com', 'wrongpassword'),
      ).rejects.toMatchObject({
        code: 'auth/invalid-credential',
        message: 'Invalid credentials',
      });
    });

    it('should handle user-not-found error', async () => {
      const mockSignIn = auth().signInWithEmailAndPassword as jest.Mock;
      mockSignIn.mockRejectedValue({
        code: 'auth/user-not-found',
        message: 'User not found',
      });

      await expect(
        FirebaseAuthService.loginWithEmail('nonexistent@example.com', 'password'),
      ).rejects.toMatchObject({
        code: 'auth/user-not-found',
      });
    });

    it('should handle network errors', async () => {
      const mockSignIn = auth().signInWithEmailAndPassword as jest.Mock;
      mockSignIn.mockRejectedValue({
        code: 'auth/network-request-failed',
        message: 'Network error',
      });

      await expect(
        FirebaseAuthService.loginWithEmail('test@example.com', 'password'),
      ).rejects.toMatchObject({
        code: 'auth/network-request-failed',
      });
    });
  });

  describe('signInWithCustomToken', () => {
    it('should successfully sign in with custom token', async () => {
      const mockSignIn = auth().signInWithCustomToken as jest.Mock;
      mockSignIn.mockResolvedValue({user: {uid: 'test-uid'}});

      await FirebaseAuthService.signInWithCustomToken('custom-token');

      expect(mockSignIn).toHaveBeenCalledWith('custom-token');
    });

    it('should throw error with invalid token', async () => {
      const mockSignIn = auth().signInWithCustomToken as jest.Mock;
      mockSignIn.mockRejectedValue({
        code: 'auth/invalid-custom-token',
        message: 'Invalid custom token',
      });

      await expect(
        FirebaseAuthService.signInWithCustomToken('invalid-token'),
      ).rejects.toMatchObject({
        code: 'auth/invalid-custom-token',
      });
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const mockSignOut = auth().signOut as jest.Mock;
      mockSignOut.mockResolvedValue(undefined);

      await FirebaseAuthService.logout();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const mockSignOut = auth().signOut as jest.Mock;
      mockSignOut.mockRejectedValue({
        code: 'auth/unknown',
        message: 'Logout failed',
      });

      await expect(FirebaseAuthService.logout()).rejects.toMatchObject({
        code: 'auth/unknown',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockUser = {uid: 'test-uid', email: 'test@example.com'};
      (auth() as any).currentUser = mockUser;

      const user = FirebaseAuthService.getCurrentUser();

      expect(user).toBe(mockUser);
    });

    it('should return null when no user is logged in', () => {
      (auth() as any).currentUser = null;

      const user = FirebaseAuthService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('onAuthStateChanged', () => {
    it('should set up auth state listener', () => {
      const mockCallback = jest.fn();
      const mockOnAuthStateChanged = auth().onAuthStateChanged as jest.Mock;
      mockOnAuthStateChanged.mockReturnValue(() => {});

      FirebaseAuthService.onAuthStateChanged(mockCallback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockCallback);
    });
  });
});
