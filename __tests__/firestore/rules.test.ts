import * as fs from 'fs';
import * as path from 'path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'demo-ziptaxi';
const RULES_PATH = path.resolve(__dirname, '../../firestore.rules');

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

afterEach(async () => {
  await env.clearFirestore();
});

// ─── /users/{uid} ────────────────────────────────────────────────────────────

describe('users 컬렉션', () => {
  test('본인 문서는 읽기 가능', async () => {
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().doc('users/alice').get());
  });

  test('타인 문서는 읽기 불가', async () => {
    const alice = env.authenticatedContext('alice');
    await assertFails(alice.firestore().doc('users/bob').get());
  });

  test('미인증 사용자는 읽기 불가', async () => {
    const unauth = env.unauthenticatedContext();
    await assertFails(unauth.firestore().doc('users/alice').get());
  });

  test('본인 문서는 쓰기 가능', async () => {
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().doc('users/alice').set({ name: 'Alice' }));
  });

  test('타인 문서는 쓰기 불가', async () => {
    const alice = env.authenticatedContext('alice');
    await assertFails(alice.firestore().doc('users/bob').set({ name: 'Alice' }));
  });

  test('미인증 사용자는 쓰기 불가', async () => {
    const unauth = env.unauthenticatedContext();
    await assertFails(unauth.firestore().doc('users/alice').set({ name: 'Guest' }));
  });
});

// ─── /users/{uid}/revenues ───────────────────────────────────────────────────

describe('revenues 서브컬렉션', () => {
  test('본인 수익 문서는 읽기 가능', async () => {
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().collection('users/alice/revenues').get(),
    );
  });

  test('타인 수익 문서는 읽기 불가', async () => {
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('users/bob/revenues').get(),
    );
  });

  test('본인 수익 문서는 쓰기 가능', async () => {
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().doc('users/alice/revenues/rev1').set({ amount: 10000 }),
    );
  });

  test('타인 수익 문서는 쓰기 불가', async () => {
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().doc('users/bob/revenues/rev1').set({ amount: 10000 }),
    );
  });
});

// ─── /users/{uid}/expenses ───────────────────────────────────────────────────

describe('expenses 서브컬렉션', () => {
  test('본인 지출 문서는 읽기 가능', async () => {
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().collection('users/alice/expenses').get(),
    );
  });

  test('타인 지출 문서는 읽기 불가', async () => {
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('users/bob/expenses').get(),
    );
  });

  test('본인 지출 문서는 쓰기 가능', async () => {
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().doc('users/alice/expenses/exp1').set({ amount: 5000 }),
    );
  });
});

// ─── /usernames ──────────────────────────────────────────────────────────────

describe('usernames 컬렉션', () => {
  test('미인증 사용자도 읽기 가능', async () => {
    const unauth = env.unauthenticatedContext();
    await assertSucceeds(unauth.firestore().doc('usernames/alice').get());
  });

  test('본인 uid로 생성 가능', async () => {
    const alice = env.authenticatedContext('alice', { email: 'alice@test.com' });
    await assertSucceeds(
      alice.firestore().doc('usernames/alice').set({
        uid: 'alice',
        email: 'alice@test.com',
      }),
    );
  });

  test('타인 uid로 생성 불가', async () => {
    const alice = env.authenticatedContext('alice', { email: 'alice@test.com' });
    await assertFails(
      alice.firestore().doc('usernames/alice').set({
        uid: 'bob',       // 본인 uid가 아님
        email: 'alice@test.com',
      }),
    );
  });

  test('본인 문서는 수정/삭제 가능', async () => {
    const alice = env.authenticatedContext('alice');
    // 먼저 관리자 컨텍스트로 문서 생성
    await env.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc('usernames/alice').set({ uid: 'alice', email: 'alice@test.com' });
    });
    await assertSucceeds(
      alice.firestore().doc('usernames/alice').update({ email: 'new@test.com' }),
    );
  });

  test('타인 문서는 수정/삭제 불가', async () => {
    const alice = env.authenticatedContext('alice');
    await env.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc('usernames/bob').set({ uid: 'bob', email: 'bob@test.com' });
    });
    await assertFails(
      alice.firestore().doc('usernames/bob').update({ email: 'hacked@test.com' }),
    );
  });
});
