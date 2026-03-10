import { login as kakaoLogin } from '@react-native-kakao/user';
import functions from '@react-native-firebase/functions';

import { firebaseAuth, firebaseDb, getServerTimestamp } from './firebase';

interface SocialProfile {
  uid: string;
  name: string;
  email: string;
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

// ─── Cloud Function Exchange ──────────────────────────────────────────────────

async function exchangeForCustomToken(accessToken: string): Promise<SocialLoginResponse> {
  const callable = functions().httpsCallable<{ provider: 'kakao'; accessToken: string }, SocialLoginResponse>(
    'socialLogin',
  );
  const { data } = await callable({ provider: 'kakao', accessToken });
  return data;
}

// ─── Firestore User Doc ───────────────────────────────────────────────────────

async function ensureUserDoc(uid: string, profile: SocialProfile): Promise<void> {
  const userRef = firebaseDb.collection('users').doc(uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const providerId = uid.split(':')[1] ?? uid;
    await userRef.set({
      name: profile.name,
      username: `kakao_${providerId}`,
      email: profile.email,
      provider: 'kakao',
      createdAt: getServerTimestamp(),
      role: 'driver',
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
 * 카카오 로그인 전체 플로우:
 * SDK 토큰 획득 → Cloud Function 검증 및 Firebase Auth 동기화 → 커스텀 토큰 로그인 → Firestore 유저 문서 생성
 */
export async function signInWithKakao(): Promise<void> {
  const accessToken = await getKakaoToken();
  const { customToken, profile } = await exchangeForCustomToken(accessToken);
  const credential = await firebaseAuth.signInWithCustomToken(customToken);
  await ensureUserDoc(credential.user.uid, profile);
}
