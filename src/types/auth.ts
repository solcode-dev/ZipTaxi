export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithKakao: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export interface FirebaseAuthError {
  code: string;
  message: string;
}

export interface KakaoProfile {
  id: string;
  email?: string;
  nickname?: string;
  profileImageUrl?: string;
}

export interface KakaoLoginResult {
  accessToken: string;
  refreshToken?: string;
}
