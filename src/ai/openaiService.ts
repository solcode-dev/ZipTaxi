import OpenAI from 'openai';
import {OPENAI_API_KEY} from '@env';

const openai = new OpenAI({
apiKey: OPENAI_API_KEY,
});

export const testAI = async () => {
try {
const response = await openai.chat.completions.create({
model: 'gpt-4o-mini',
messages: [
{role: 'user', content: '안녕! 짧게 인사해줘'}
],
max_tokens: 50,
});

return response.choices[0].message.content;
} catch (error) {
console.error('AI 호출 에러:', error);
    throw error;
  }
};