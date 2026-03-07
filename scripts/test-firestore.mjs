/**
 * Firebase Emulator 통합 테스트 스크립트
 * 실행: node scripts/test-firestore.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// ─── 에뮬레이터 연결 ──────────────────────────────────────────────────────────
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

initializeApp({ projectId: 'demo-ziptaxi' });
const db = getFirestore();
const auth = getAuth();

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
const getTodayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getLastMonthStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-15`;
};

let passed = 0;
let failed = 0;

const assert = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` → ${detail}` : ''}`);
    failed++;
  }
};

// ─── 테스트 유저 셋업 ──────────────────────────────────────────────────────────
let uid;
const userRef = () => db.collection('users').doc(uid);

async function setup() {
  // 기존 테스트 유저 삭제 후 재생성
  try {
    const existing = await auth.getUserByEmail('tester@ziptaxi.com');
    await auth.deleteUser(existing.uid);
  } catch {}

  const user = await auth.createUser({ email: 'tester@ziptaxi.com', password: 'test1234' });
  uid = user.uid;

  await userRef().set({
    name: '테스트기사',
    totalRevenue: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    monthlyGoal: 300000,
    monthlyExpense: 0,
    todayExpense: 0,
    monthlyDrivingMinutes: 0,
    monthlyDistanceKm: 0,
    lastRevenueDate: '',
    lastExpenseDate: '',
    lastDrivingDate: '',
  });
}

async function cleanup() {
  // 서브컬렉션 삭제
  const batch = db.batch();
  const revenues = await userRef().collection('revenues').listDocuments();
  const expenses = await userRef().collection('expenses').listDocuments();
  revenues.forEach(r => batch.delete(r));
  expenses.forEach(e => batch.delete(e));
  await batch.commit();

  await userRef().update({
    totalRevenue: 0, todayRevenue: 0, monthlyRevenue: 0,
    monthlyExpense: 0, todayExpense: 0,
    monthlyDrivingMinutes: 0, monthlyDistanceKm: 0,
    lastRevenueDate: '', lastExpenseDate: '', lastDrivingDate: '',
  });
}

// ─── 수익 로직 (hooks/useRevenueTracker 동일 로직) ────────────────────────────
async function addRevenue(amount, source = 'meter', note = '') {
  const todayStr = getTodayStr();
  const ref = userRef();
  const newRef = ref.collection('revenues').doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data();
    const lastDate = d.lastRevenueDate || '';
    const lastMonth = lastDate.slice(0, 7);
    const thisMonth = todayStr.slice(0, 7);

    const todayRevenue = lastDate !== todayStr ? 0 : (d.todayRevenue || 0);
    const monthlyRevenue = (lastMonth && lastMonth !== thisMonth) ? 0 : (d.monthlyRevenue || 0);

    tx.set(newRef, { amount, source, note, dateStr: todayStr, timestamp: new Date() });
    tx.update(ref, {
      totalRevenue: (d.totalRevenue || 0) + amount,
      todayRevenue: todayRevenue + amount,
      monthlyRevenue: monthlyRevenue + amount,
      lastRevenueDate: todayStr,
    });
  });
  return newRef.id;
}

async function deleteRevenue(revenueId, amount, dateStr) {
  const todayStr = getTodayStr();
  const ref = userRef();
  const revenueRef = ref.collection('revenues').doc(revenueId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data();
    const newToday = dateStr === todayStr
      ? Math.max(0, (d.todayRevenue || 0) - amount)
      : (d.todayRevenue || 0);

    tx.delete(revenueRef);
    tx.update(ref, {
      totalRevenue: Math.max(0, (d.totalRevenue || 0) - amount),
      monthlyRevenue: Math.max(0, (d.monthlyRevenue || 0) - amount),
      todayRevenue: newToday,
    });
  });
}

// ─── 지출 로직 (hooks/useExpenseTracker 동일 로직) ────────────────────────────
async function addExpense(amount, category = 'fuel', note = '') {
  const todayStr = getTodayStr();
  const ref = userRef();
  const newRef = ref.collection('expenses').doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data();
    const lastDate = d.lastExpenseDate || '';
    const lastMonth = lastDate.slice(0, 7);
    const thisMonth = todayStr.slice(0, 7);

    const todayExpense = lastDate !== todayStr ? 0 : (d.todayExpense || 0);
    const monthlyExpense = (lastMonth && lastMonth !== thisMonth) ? 0 : (d.monthlyExpense || 0);

    tx.set(newRef, { amount, category, note, dateStr: todayStr, timestamp: new Date() });
    tx.update(ref, {
      todayExpense: todayExpense + amount,
      monthlyExpense: monthlyExpense + amount,
      lastExpenseDate: todayStr,
    });
  });
  return newRef.id;
}

async function deleteExpense(expenseId, amount, dateStr) {
  const todayStr = getTodayStr();
  const ref = userRef();
  const expenseRef = ref.collection('expenses').doc(expenseId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data();
    const newToday = dateStr === todayStr
      ? Math.max(0, (d.todayExpense || 0) - amount)
      : (d.todayExpense || 0);

    tx.delete(expenseRef);
    tx.update(ref, {
      todayExpense: newToday,
      monthlyExpense: Math.max(0, (d.monthlyExpense || 0) - amount),
    });
  });
}

// ─── 운행 로직 (hooks/useDrivingStats 동일 로직) ─────────────────────────────
async function addDrivingSession(minutes, distanceKm) {
  const todayStr = getTodayStr();
  const ref = userRef();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data();
    const lastMonth = (d.lastDrivingDate || '').slice(0, 7);
    const thisMonth = todayStr.slice(0, 7);
    const isNewMonth = lastMonth !== thisMonth;

    const currentMinutes = isNewMonth ? 0 : (d.monthlyDrivingMinutes || 0);
    const currentDistance = isNewMonth ? 0 : (d.monthlyDistanceKm || 0);

    tx.update(ref, {
      monthlyDrivingMinutes: currentMinutes + minutes,
      monthlyDistanceKm: Math.round((currentDistance + distanceKm) * 10) / 10,
      lastDrivingDate: todayStr,
    });
  });
}

// ─── 테스트 케이스 ────────────────────────────────────────────────────────────

async function test_수익_추가() {
  console.log('\n📋 [수익 추가]');
  await cleanup();

  await addRevenue(50000, 'meter');
  const d = (await userRef().get()).data();

  assert('todayRevenue = 50,000', d.todayRevenue === 50000, `실제: ${d.todayRevenue}`);
  assert('monthlyRevenue = 50,000', d.monthlyRevenue === 50000, `실제: ${d.monthlyRevenue}`);
  assert('totalRevenue = 50,000', d.totalRevenue === 50000, `실제: ${d.totalRevenue}`);
  assert('lastRevenueDate = 오늘', d.lastRevenueDate === getTodayStr(), `실제: ${d.lastRevenueDate}`);

  const revenues = await userRef().collection('revenues').get();
  assert('revenues 서브컬렉션 문서 1개 생성', revenues.size === 1, `실제: ${revenues.size}개`);
  assert('revenues 문서 amount = 50,000', revenues.docs[0].data().amount === 50000);
}

async function test_수익_누적() {
  console.log('\n📋 [수익 누적 - 같은 날 2회 입력]');
  await cleanup();

  await addRevenue(30000);
  await addRevenue(20000);
  const d = (await userRef().get()).data();

  assert('todayRevenue = 50,000 (누적)', d.todayRevenue === 50000, `실제: ${d.todayRevenue}`);
  assert('monthlyRevenue = 50,000 (누적)', d.monthlyRevenue === 50000, `실제: ${d.monthlyRevenue}`);
  assert('totalRevenue = 50,000 (누적)', d.totalRevenue === 50000, `실제: ${d.totalRevenue}`);

  const revenues = await userRef().collection('revenues').get();
  assert('revenues 문서 2개', revenues.size === 2, `실제: ${revenues.size}개`);
}

async function test_수익_삭제() {
  console.log('\n📋 [수익 삭제]');
  await cleanup();

  const id = await addRevenue(50000);
  await deleteRevenue(id, 50000, getTodayStr());
  const d = (await userRef().get()).data();

  assert('todayRevenue = 0 (삭제 후)', d.todayRevenue === 0, `실제: ${d.todayRevenue}`);
  assert('monthlyRevenue = 0 (삭제 후)', d.monthlyRevenue === 0, `실제: ${d.monthlyRevenue}`);
  assert('totalRevenue = 0 (삭제 후)', d.totalRevenue === 0, `실제: ${d.totalRevenue}`);

  const revenues = await userRef().collection('revenues').get();
  assert('revenues 문서 0개 (삭제됨)', revenues.size === 0, `실제: ${revenues.size}개`);
}

async function test_수익_음수_방지() {
  console.log('\n📋 [수익 음수 방지]');
  await cleanup();

  await addRevenue(10000);
  await deleteRevenue('fake-id-doesnt-matter', 99999, getTodayStr());
  const d = (await userRef().get()).data();

  // totalRevenue는 Math.max(0, ...) 처리
  assert('totalRevenue 음수 안됨', d.totalRevenue >= 0, `실제: ${d.totalRevenue}`);
}

async function test_지출_추가() {
  console.log('\n📋 [지출 추가]');
  await cleanup();

  await addExpense(30000, 'fuel');
  const d = (await userRef().get()).data();

  assert('todayExpense = 30,000', d.todayExpense === 30000, `실제: ${d.todayExpense}`);
  assert('monthlyExpense = 30,000', d.monthlyExpense === 30000, `실제: ${d.monthlyExpense}`);
  assert('lastExpenseDate = 오늘', d.lastExpenseDate === getTodayStr());

  const expenses = await userRef().collection('expenses').get();
  assert('expenses 문서 1개 생성', expenses.size === 1);
  assert('category = fuel', expenses.docs[0].data().category === 'fuel');
}

async function test_지출_삭제() {
  console.log('\n📋 [지출 삭제]');
  await cleanup();

  const id = await addExpense(30000, 'meals');
  await deleteExpense(id, 30000, getTodayStr());
  const d = (await userRef().get()).data();

  assert('todayExpense = 0 (삭제 후)', d.todayExpense === 0, `실제: ${d.todayExpense}`);
  assert('monthlyExpense = 0 (삭제 후)', d.monthlyExpense === 0, `실제: ${d.monthlyExpense}`);

  const expenses = await userRef().collection('expenses').get();
  assert('expenses 문서 0개 (삭제됨)', expenses.size === 0);
}

async function test_운행기록_추가() {
  console.log('\n📋 [운행 기록 추가]');
  await cleanup();

  await addDrivingSession(90, 45.5);
  const d = (await userRef().get()).data();

  assert('monthlyDrivingMinutes = 90', d.monthlyDrivingMinutes === 90, `실제: ${d.monthlyDrivingMinutes}`);
  assert('monthlyDistanceKm = 45.5', d.monthlyDistanceKm === 45.5, `실제: ${d.monthlyDistanceKm}`);
  assert('lastDrivingDate = 오늘', d.lastDrivingDate === getTodayStr());
}

async function test_운행기록_누적() {
  console.log('\n📋 [운행 기록 누적]');
  await cleanup();

  await addDrivingSession(60, 30.0);
  await addDrivingSession(30, 15.5);
  const d = (await userRef().get()).data();

  assert('monthlyDrivingMinutes = 90 (누적)', d.monthlyDrivingMinutes === 90, `실제: ${d.monthlyDrivingMinutes}`);
  assert('monthlyDistanceKm = 45.5 (누적)', d.monthlyDistanceKm === 45.5, `실제: ${d.monthlyDistanceKm}`);
}

async function test_월간_리셋_수익() {
  console.log('\n📋 [월간 리셋 - 지난달 데이터로 수익 입력]');
  await cleanup();

  // 지난달 날짜로 세팅
  await userRef().update({
    totalRevenue: 500000,
    todayRevenue: 50000,
    monthlyRevenue: 500000,
    lastRevenueDate: getLastMonthStr(),
  });

  // 이번달 수익 추가 → 월간 리셋 후 새로 계산
  await addRevenue(100000);
  const d = (await userRef().get()).data();

  assert('monthlyRevenue 리셋 후 100,000 (지난달 누적 초기화)', d.monthlyRevenue === 100000, `실제: ${d.monthlyRevenue}`);
  assert('totalRevenue는 리셋 안됨 (전체 누적)', d.totalRevenue === 600000, `실제: ${d.totalRevenue}`);
}

async function test_월간_리셋_지출() {
  console.log('\n📋 [월간 리셋 - 지난달 데이터로 지출 입력]');
  await cleanup();

  await userRef().update({
    monthlyExpense: 200000,
    todayExpense: 20000,
    lastExpenseDate: getLastMonthStr(),
  });

  await addExpense(50000, 'maintenance');
  const d = (await userRef().get()).data();

  assert('monthlyExpense 리셋 후 50,000 (지난달 지출 초기화)', d.monthlyExpense === 50000, `실제: ${d.monthlyExpense}`);
}

async function test_수익_지출_동시() {
  console.log('\n📋 [수익 + 지출 동시 입력 → 순이익 계산]');
  await cleanup();

  await addRevenue(200000);
  await addExpense(50000, 'fuel');
  const d = (await userRef().get()).data();

  const netProfit = d.monthlyRevenue - d.monthlyExpense;
  assert('monthlyRevenue = 200,000', d.monthlyRevenue === 200000, `실제: ${d.monthlyRevenue}`);
  assert('monthlyExpense = 50,000', d.monthlyExpense === 50000, `실제: ${d.monthlyExpense}`);
  assert('순이익 = 150,000', netProfit === 150000, `실제: ${netProfit}`);
}

// ─── 실행 ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('🔥 Firebase Emulator 통합 테스트 시작');
  console.log('━'.repeat(50));

  await setup();

  await test_수익_추가();
  await test_수익_누적();
  await test_수익_삭제();
  await test_수익_음수_방지();
  await test_지출_추가();
  await test_지출_삭제();
  await test_운행기록_추가();
  await test_운행기록_누적();
  await test_월간_리셋_수익();
  await test_월간_리셋_지출();
  await test_수익_지출_동시();

  console.log('\n' + '━'.repeat(50));
  console.log(`\n🏁 결과: ${passed + failed}개 중 ✅ ${passed}개 통과 / ❌ ${failed}개 실패\n`);

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('\n💥 테스트 실행 오류:', e.message);
  process.exit(1);
});
