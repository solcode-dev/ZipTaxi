// ─── @react-native-kakao/user ────────────────────────────────────────────────
declare module '@react-native-kakao/user' {
  export interface KakaoLoginResult {
    accessToken: string;
    refreshToken: string;
    idToken?: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    scopes: string[];
  }

  /** Kakao OAuth 로그인을 시작합니다. */
  export function login(): Promise<KakaoLoginResult>;
  export function logout(): Promise<void>;
  export function unlink(): Promise<void>;
}

// ─── @react-native-seoul/naver-login ─────────────────────────────────────────
declare module '@react-native-seoul/naver-login' {
  export interface NaverLoginToken {
    accessToken: string;
    refreshToken: string;
    expiresAtUnixSecondString: string;
    tokenType: string;
  }

  export interface NaverProfile {
    resultcode: string;
    message: string;
    response: {
      id: string;
      name: string;
      email: string;
      mobile?: string;
      profile_image?: string;
    };
  }

  export interface NaverLoginConfig {
    appName: string;
    consumerKey: string;
    consumerSecret: string;
    serviceUrlScheme?: string;
  }

  export const NaverLogin: {
    /** Naver OAuth 로그인을 시작합니다. */
    login(
      config: NaverLoginConfig,
      callback: (err: Error | null, token: NaverLoginToken | null) => void,
    ): void;
    logout(): Promise<void>;
    getProfile(accessToken: string): Promise<NaverProfile>;
  };
}

// ─── @react-native-firebase/functions ────────────────────────────────────────
declare module '@react-native-firebase/functions' {
  export interface HttpsCallableResult<T = unknown> {
    readonly data: T;
  }

  export interface HttpsCallable<Req = unknown, Res = unknown> {
    (data?: Req): Promise<HttpsCallableResult<Res>>;
  }

  export interface FirebaseFunctions {
    httpsCallable<Req = unknown, Res = unknown>(name: string): HttpsCallable<Req, Res>;
  }

  export default function functions(): FirebaseFunctions;
}
