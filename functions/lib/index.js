"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRevenue = exports.socialLogin = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const openai_1 = __importDefault(require("openai"));
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
(0, app_1.initializeApp)();
// OpenAI 인스턴스 — 함수 호출 시점에 Secret 값으로 초기화
const getOpenAI = () => new openai_1.default({ apiKey: openaiApiKey.value() });
// ─── 소셜 로그인 헬퍼 ────────────────────────────────────────────────────────
async function fetchJson(url, bearerToken) {
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
    });
    if (!res.ok) {
        throw new https_1.HttpsError('unauthenticated', `API call failed: ${res.status}`);
    }
    return res.json();
}
async function resolveKakao(accessToken) {
    const user = await fetchJson('https://kapi.kakao.com/v2/user/me', accessToken);
    return {
        uid: `kakao:${user.id}`,
        name: user.kakao_account?.profile?.nickname ?? '기사님',
        email: user.kakao_account?.email ?? '',
    };
}
async function syncFirebaseAuthUser(profile) {
    const auth = (0, auth_1.getAuth)();
    const userRecord = { displayName: profile.name, email: profile.email || undefined };
    try {
        await auth.updateUser(profile.uid, userRecord);
    }
    catch (e) {
        if (e.code === 'auth/user-not-found') {
            await auth.createUser({ uid: profile.uid, ...userRecord });
        }
        else {
            throw e;
        }
    }
}
// ─── Cloud Functions ──────────────────────────────────────────────────────────
/**
 * [카카오 소셜 로그인]
 * 카카오 액세스 토큰을 검증하고 Firebase Auth 유저를 동기화한 뒤 커스텀 토큰을 발급합니다.
 */
exports.socialLogin = (0, https_1.onCall)(async (request) => {
    const { provider, accessToken } = request.data;
    if (provider !== 'kakao' || !accessToken) {
        throw new https_1.HttpsError('invalid-argument', 'provider must be kakao and accessToken is required');
    }
    const profile = await resolveKakao(accessToken);
    await syncFirebaseAuthUser(profile);
    const customToken = await (0, auth_1.getAuth)().createCustomToken(profile.uid, { provider });
    return { customToken, profile };
});
/**
 * [수익 AI 분석]
 * 클라이언트로부터 수익 요약 텍스트를 받아 OpenAI로 분석 결과를 반환합니다.
 * OPENAI_API_KEY는 서버 환경변수에만 존재하며 클라이언트에 노출되지 않습니다.
 */
exports.analyzeRevenue = (0, https_1.onCall)({ secrets: [openaiApiKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const { type, summary } = request.data;
    if (!summary?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'summary is required');
    }
    const prompt = type === 'weekly'
        ? `이번 주 수입 데이터:\n\n${summary}\n\n패턴을 분석하고 다음 주 전략을 조언해주세요.`
        : `이번 달 수입 데이터:\n\n${summary}\n\n패턴 분석과 목표 달성 전략을 조언해주세요.`;
    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: '당신은 개인택시 기사님의 수입 데이터를 분석하는 전문가입니다. ' +
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
});
//# sourceMappingURL=index.js.map