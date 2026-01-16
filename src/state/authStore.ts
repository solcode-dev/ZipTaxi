import {create} from 'zustand';
import {AuthState, User} from '../types/auth';
import {FirebaseAuthService} from '../services/firebaseAuth';
import {KakaoAuthService} from '../services/kakaoAuth';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setLoading: (loading: boolean) => {
    set({isLoading: loading});
  },

  login: async (email: string, password: string) => {
    try {
      set({isLoading: true});
      await FirebaseAuthService.loginWithEmail(email, password);
      // User state will be updated by auth state listener
    } catch (error: any) {
      set({isLoading: false});
      throw error;
    }
  },

  loginWithKakao: async () => {
    try {
      set({isLoading: true});

      // Step 1: Login with Kakao
      await KakaoAuthService.login();

      // Step 2: Get Kakao profile
      const profile = await KakaoAuthService.getProfile();

      // Step 3: For now, we'll use the Kakao token directly
      // In a production app, you would exchange this token with your backend
      // to get a Firebase custom token
      // For demonstration, we'll create a mock custom token
      // You need to implement a backend endpoint to exchange Kakao token for Firebase token

      // This is a placeholder - in production, call your backend:
      // const customToken = await exchangeKakaoTokenForFirebase(kakaoResult.accessToken);
      // await FirebaseAuthService.signInWithCustomToken(customToken);

      // For now, we'll just set a mock user (this won't work with actual Firebase)
      // You MUST implement the backend token exchange for this to work properly
      if (__DEV__) {
        console.warn(
          'Kakao login successful, but Firebase integration requires backend implementation',
        );
      }

      // Mock user for demonstration
      const mockUser: User = {
        uid: profile.id,
        email: profile.email || null,
        displayName: profile.nickname || null,
        photoURL: profile.profileImageUrl || null,
      };

      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({isLoading: false});
      throw error;
    }
  },

  logout: async () => {
    try {
      set({isLoading: true});
      await FirebaseAuthService.logout();
      // Also logout from Kakao if needed
      await KakaoAuthService.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({isLoading: false});
      throw error;
    }
  },
}));

// Initialize auth state listener
FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
    useAuthStore.getState().setUser(user);
  } else {
    useAuthStore.getState().setUser(null);
  }
});
