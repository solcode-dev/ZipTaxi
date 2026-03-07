import { login as kakaoLogin } from '@react-native-kakao/user';
import NaverLogin from '@react-native-seoul/naver-login';
import functions from '@react-native-firebase/functions';
import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '@env';

import { firebaseAuth, firebaseDb, getServerTimestamp } from './firebase';

export type SocialProvider = 'kakao' | 'naver';

interface SocialProfile {
  uid: string;
  name: string;
  email: string;
}

interface SocialLoginRequest {
  provider: SocialProvider;
  accessToken: string;
}

interface SocialLoginResponse {
  customToken: string;
  profile: SocialProfile;
}

// ─── Token Acquisition ────────────────────────────────────────────────────────

async function getKakaoToken(): Promise<string> {
  const { accessToken } = await kakaoLogin();
  return accessToken;
}

async function getNaverToken(): Promise<string> {
  NaverLogin.initialize({
    appName: 'ZipTaxi',
    consumerKey: NAVER_CLIENT_ID,
    consumerSecret: NAVER_CLIENT_SECRET,
    serviceUrlSchemeIOS: 'ziptaxi',
  });

  const result = await NaverLogin.login();
  if (!result.isSuccess || !result.successResponse?.accessToken) {
    const msg = result.failureResponse?.isCancel
      ? '네이버 로그인이 취소되었습니다.'
      : (result.failureResponse?.message ?? '네이버 로그인에 실패했습니다.');
    throw new Error(msg);
  }
  return result.successResponse.accessToken;
}

// ─── Cloud Function Exchange ──────────────────────────────────────────────────

async function exchangeForCustomToken(
  provider: SocialProvider,
  accessToken: string,
): Promise<SocialLoginResponse> {
  const callable = functions().httpsCallable<SocialLoginRequest, SocialLoginResponse>(
    'socialLogin',
  );
  const { data } = await callable({ provider, accessToken });
  return data;
}

// ─── Firestore User Doc ───────────────────────────────────────────────────────

async function ensureUserDoc(
  uid: string,
  profile: SocialProfile,
  provider: SocialProvider,
): Promise<void> {
  const userRef = firebaseDb.collection('users').doc(uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    // provider 뒤의 숫자 ID 추출 (kakao:12345 → 12345)
    const providerId = uid.split(':')[1] ?? uid;
    await userRef.set({
      name: profile.name,
      username: `${provider}_${providerId}`,
      email: profile.email,
      provider,
      createdAt: getServerTimestamp(),
      role: 'driver',
      // 수익/지출/운행 초기값
      totalRevenue: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
      monthlyGoal: 0,
      monthlyExpense: 0,
      todayExpense: 0,
      monthlyDrivingMinutes: 0,
      monthlyDistanceKm: 0,
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * 소셜 로그인 전체 플로우:
 * SDK 토큰 획득 → Cloud Function 검증 → Firebase 커스텀 토큰 로그인 → Firestore 유저 문서 생성
 */
export async function signInWithSocial(provider: SocialProvider): Promise<void> {
  const accessToken = await (provider === 'kakao' ? getKakaoToken() : getNaverToken());
  const { customToken, profile } = await exchangeForCustomToken(provider, accessToken);
  const credential = await firebaseAuth.signInWithCustomToken(customToken);
  await ensureUserDoc(credential.user.uid, profile, provider);
}
