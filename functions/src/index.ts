import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import OpenAI from 'openai';

const openaiApiKey = defineSecret('OPENAI_API_KEY');

initializeApp();

// OpenAI 인스턴스 — 함수 호출 시점에 Secret 값으로 초기화
const getOpenAI = () => new OpenAI({ apiKey: openaiApiKey.value() });

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface SocialProfile {
  uid: string;
  name: string;
  email: string;
}

interface SocialLoginRequest {
  provider: 'kakao';
  accessToken: string;
}

interface SocialLoginResponse {
  customToken: string;
  profile: SocialProfile;
}

type AnalysisType = 'weekly' | 'monthly';

interface AnalyzeRevenueRequest {
  type: AnalysisType;
  summary: string;
}

interface AnalyzeRevenueResponse {
  analysis: string;
}

// ─── 소셜 로그인 헬퍼 ────────────────────────────────────────────────────────

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

async function syncFirebaseAuthUser(profile: SocialProfile): Promise<void> {
  const auth = getAuth();
  const userRecord = { displayName: profile.name, email: profile.email || undefined };
  try {
    await auth.updateUser(profile.uid, userRecord);
  } catch (e: any) {
    if (e.code === 'auth/user-not-found') {
      await auth.createUser({ uid: profile.uid, ...userRecord });
    } else {
      throw e;
    }
  }
}

// ─── Cloud Functions ──────────────────────────────────────────────────────────

/**
 * [카카오 소셜 로그인]
 * 카카오 액세스 토큰을 검증하고 Firebase Auth 유저를 동기화한 뒤 커스텀 토큰을 발급합니다.
 */
export const socialLogin = onCall<SocialLoginRequest, Promise<SocialLoginResponse>>(
  async (request) => {
    const { provider, accessToken } = request.data;

    if (provider !== 'kakao' || !accessToken) {
      throw new HttpsError('invalid-argument', 'provider must be kakao and accessToken is required');
    }

    const profile = await resolveKakao(accessToken);
    await syncFirebaseAuthUser(profile);
    const customToken = await getAuth().createCustomToken(profile.uid, { provider });
    return { customToken, profile };
  },
);

/**
 * [수익 AI 분석]
 * 클라이언트로부터 수익 요약 텍스트를 받아 OpenAI로 분석 결과를 반환합니다.
 * OPENAI_API_KEY는 서버 환경변수에만 존재하며 클라이언트에 노출되지 않습니다.
 */
export const analyzeRevenue = onCall<AnalyzeRevenueRequest, Promise<AnalyzeRevenueResponse>>(
  { secrets: [openaiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { type, summary } = request.data;

    if (!summary?.trim()) {
      throw new HttpsError('invalid-argument', 'summary is required');
    }

    const prompt =
      type === 'weekly'
        ? `이번 주 수입 데이터:\n\n${summary}\n\n패턴을 분석하고 다음 주 전략을 조언해주세요.`
        : `이번 달 수입 데이터:\n\n${summary}\n\n패턴 분석과 목표 달성 전략을 조언해주세요.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '당신은 개인택시 기사님의 수입 데이터를 분석하는 전문가입니다. ' +
            '데이터를 바탕으로 구체적인 패턴("수요일 카카오T 수입이 가장 높습니다" 등)을 찾아 ' +
            '실용적인 조언을 2~3문장으로 제공하세요. 친근하고 격려하는 말투를 사용하세요.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: type === 'weekly' ? 200 : 250,
      temperature: 0.7,
    });

    const analysis = response.choices[0].message.content ?? '';
    return { analysis };
  },
);
