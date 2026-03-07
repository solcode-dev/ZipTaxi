/**
 * Firestore 보안 규칙 테스트
 * 실행: node scripts/test-rules.mjs
 *
 * 에뮬레이터가 실행 중이어야 합니다 (npm run emulators).
 */

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');

let testEnv;
let passed = 0;
let failed = 0;

const assert = async (label, promise) => {
  try {
    await promise;
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${label} → ${e.message ?? e}`);
    failed++;
  }
};

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

const getDb = (uid) =>
  uid
    ? testEnv.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore()
    : testEnv.unauthenticatedContext().firestore();

// ─── 테스트 케이스 ────────────────────────────────────────────────────────────

async function test_usernames() {
  console.log('\n📋 [usernames 컬렉션]');

  // 미인증 읽기 허용
  const anonDb = getDb(null);
  await assert(
    '미인증 사용자 → usernames 읽기 허용 (로그인용)',
    assertSucceeds(getDoc(doc(anonDb, 'usernames', 'driver1'))),
  );

  // 인증 사용자 — 본인 문서 생성 허용
  const aliceDb = testEnv.authenticatedContext('alice-uid', { email: 'alice@example.com' }).firestore();
  await assert(
    '인증 사용자 → 본인 uid·email로 usernames 생성 허용',
    assertSucceeds(
      setDoc(doc(aliceDb, 'usernames', 'alice'), {
        email: 'alice@example.com',
        uid: 'alice-uid',
      }),
    ),
  );

  // uid 불일치 → 거부
  await assert(
    'uid 불일치 → usernames 생성 거부',
    assertFails(
      setDoc(doc(aliceDb, 'usernames', 'fake'), {
        email: 'alice@example.com',
        uid: 'other-uid',          // 본인 uid가 아님
      }),
    ),
  );

  // email 불일치 → 거부
  await assert(
    'email 불일치 → usernames 생성 거부',
    assertFails(
      setDoc(doc(aliceDb, 'usernames', 'alice2'), {
        email: 'hacker@example.com',  // 인증된 이메일과 다름
        uid: 'alice-uid',
      }),
    ),
  );

  // 타인 문서 삭제 → 거부
  const bobDb = getDb('bob-uid');
  await assert(
    '다른 사용자 → alice의 usernames 삭제 거부',
    assertFails(deleteDoc(doc(bobDb, 'usernames', 'alice'))),
  );

  // 본인 문서 삭제 → 허용
  await assert(
    '본인 → 자신의 usernames 삭제 허용',
    assertSucceeds(deleteDoc(doc(aliceDb, 'usernames', 'alice'))),
  );

  // 미인증 → 쓰기 거부
  await assert(
    '미인증 사용자 → usernames 쓰기 거부',
    assertFails(
      setDoc(doc(anonDb, 'usernames', 'hacker'), {
        email: 'hacker@example.com',
        uid: 'hacker-uid',
      }),
    ),
  );
}

async function test_users() {
  console.log('\n📋 [users 컬렉션]');

  const aliceDb = getDb('alice-uid');
  const bobDb   = getDb('bob-uid');
  const anonDb  = getDb(null);

  // 사전 데이터: alice 문서 생성 (Admin으로)
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice-uid'), {
      name: 'Alice', totalRevenue: 100000,
    });
  });

  // 본인 문서 읽기 → 허용
  await assert(
    '본인 → users/{uid} 읽기 허용',
    assertSucceeds(getDoc(doc(aliceDb, 'users', 'alice-uid'))),
  );

  // 타인 문서 읽기 → 거부
  await assert(
    '다른 사용자 → 타인의 users 읽기 거부',
    assertFails(getDoc(doc(bobDb, 'users', 'alice-uid'))),
  );

  // 미인증 → 거부
  await assert(
    '미인증 사용자 → users 읽기 거부',
    assertFails(getDoc(doc(anonDb, 'users', 'alice-uid'))),
  );

  // 본인 문서 수정 → 허용
  await assert(
    '본인 → users 수정 허용',
    assertSucceeds(updateDoc(doc(aliceDb, 'users', 'alice-uid'), { monthlyGoal: 500000 })),
  );

  // 타인 문서 수정 → 거부
  await assert(
    '다른 사용자 → 타인의 users 수정 거부',
    assertFails(updateDoc(doc(bobDb, 'users', 'alice-uid'), { totalRevenue: 0 })),
  );
}

async function test_revenues() {
  console.log('\n📋 [revenues 서브컬렉션]');

  const aliceDb = getDb('alice-uid');
  const bobDb   = getDb('bob-uid');

  // 사전 데이터
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(
      doc(ctx.firestore(), 'users', 'alice-uid', 'revenues', 'rev-1'),
      { amount: 50000, dateStr: '2026-03-07' },
    );
  });

  // 본인 읽기 → 허용
  await assert(
    '본인 → revenues 읽기 허용',
    assertSucceeds(getDoc(doc(aliceDb, 'users', 'alice-uid', 'revenues', 'rev-1'))),
  );

  // 타인 읽기 → 거부
  await assert(
    '다른 사용자 → 타인의 revenues 읽기 거부',
    assertFails(getDoc(doc(bobDb, 'users', 'alice-uid', 'revenues', 'rev-1'))),
  );

  // 본인 쓰기 → 허용
  await assert(
    '본인 → revenues 쓰기 허용',
    assertSucceeds(
      setDoc(doc(aliceDb, 'users', 'alice-uid', 'revenues', 'rev-2'), {
        amount: 30000, dateStr: '2026-03-07',
      }),
    ),
  );

  // 타인 쓰기 → 거부
  await assert(
    '다른 사용자 → 타인의 revenues 쓰기 거부',
    assertFails(
      setDoc(doc(bobDb, 'users', 'alice-uid', 'revenues', 'rev-3'), {
        amount: 999999, dateStr: '2026-03-07',
      }),
    ),
  );

  // 본인 삭제 → 허용
  await assert(
    '본인 → revenues 삭제 허용',
    assertSucceeds(deleteDoc(doc(aliceDb, 'users', 'alice-uid', 'revenues', 'rev-1'))),
  );
}

async function test_expenses() {
  console.log('\n📋 [expenses 서브컬렉션]');

  const aliceDb = getDb('alice-uid');
  const bobDb   = getDb('bob-uid');

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(
      doc(ctx.firestore(), 'users', 'alice-uid', 'expenses', 'exp-1'),
      { amount: 30000, category: 'fuel' },
    );
  });

  await assert(
    '본인 → expenses 읽기 허용',
    assertSucceeds(getDoc(doc(aliceDb, 'users', 'alice-uid', 'expenses', 'exp-1'))),
  );

  await assert(
    '다른 사용자 → 타인의 expenses 읽기 거부',
    assertFails(getDoc(doc(bobDb, 'users', 'alice-uid', 'expenses', 'exp-1'))),
  );

  await assert(
    '다른 사용자 → 타인의 expenses 쓰기 거부',
    assertFails(
      setDoc(doc(bobDb, 'users', 'alice-uid', 'expenses', 'exp-2'), {
        amount: 0, category: 'other',
      }),
    ),
  );
}

// ─── 실행 ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🔒 Firestore 보안 규칙 테스트 시작');
  console.log('━'.repeat(50));

  testEnv = await initializeTestEnvironment({
    projectId: 'demo-ziptaxi',
    firestore: {
      rules,
      host: 'localhost',
      port: 8080,
    },
  });

  await test_usernames();
  await test_users();
  await test_revenues();
  await test_expenses();

  await testEnv.cleanup();

  console.log('\n' + '━'.repeat(50));
  console.log(`\n🏁 결과: ${passed + failed}개 중 ✅ ${passed}개 통과 / ❌ ${failed}개 실패\n`);

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('\n💥 테스트 실행 오류:', e.message);
  process.exit(1);
});
