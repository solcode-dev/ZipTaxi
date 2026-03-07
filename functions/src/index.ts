import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp();

type SocialProvider = 'kakao' | 'naver';

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

async function fetchJson(url: string, bearerToken: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!res.ok) {
    throw new HttpsError('unauthenticated', `API call failed: ${res.status}`);
  }
  return res.json();
}

async function resolveKakao(accessToken: string): Promise<SocialProfile> {
  const user = await fetchJson('https://kapi.kakao.com/v2/user/me', accessToken);
  return {
    uid: `kakao:${user.id}`,
    name: user.kakao_account?.profile?.nickname ?? '기사님',
    email: user.kakao_account?.email ?? '',
  };
}

async function resolveNaver(accessToken: string): Promise<SocialProfile> {
  const { response } = await fetchJson('https://openapi.naver.com/v1/nid/me', accessToken);
  return {
    uid: `naver:${response.id}`,
    name: response.name ?? '기사님',
    email: response.email ?? '',
  };
}

/**
 * [소셜 로그인 Cloud Function]
 * 클라이언트로부터 Kakao 또는 Naver 액세스 토큰을 받아
 * 각 플랫폼 API로 검증 후 Firebase 커스텀 토큰을 발급합니다.
 */
export const socialLogin = onCall<SocialLoginRequest, Promise<SocialLoginResponse>>(
  async (request) => {
    const { provider, accessToken } = request.data;

    if (!provider || !accessToken) {
      throw new HttpsError('invalid-argument', 'provider and accessToken are required');
    }

    let profile: SocialProfile;

    if (provider === 'kakao') {
      profile = await resolveKakao(accessToken);
    } else if (provider === 'naver') {
      profile = await resolveNaver(accessToken);
    } else {
      throw new HttpsError('invalid-argument', `Unsupported provider: ${provider}`);
    }

    const customToken = await getAuth().createCustomToken(profile.uid, { provider });
    return { customToken, profile };
  },
);
