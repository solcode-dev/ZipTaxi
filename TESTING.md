# ZipTaxi 로컬 테스트 가이드

## 사전 요구사항

- Node.js >= 20
- Firebase CLI (`npm install -g firebase-tools`)
- Java (Firebase 에뮬레이터 실행에 필요)
- Docker (Docker 방식 사용 시)

---

## 방법 1: 로컬 직접 실행

### 1. Firebase 에뮬레이터 시작

```bash
npm run emulators
# 또는
firebase emulators:start --only auth,firestore --project demo-ziptaxi
```

포트:
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

### 2. 테스트 실행 (에뮬레이터 켜진 상태에서)

```bash
npm run test:emulator
# 또는
FIREBASE_EMULATOR=true jest
```

### 3. 일반 단위 테스트

```bash
npm test
```

---

## 방법 2: Docker 사용

### 빌드 및 에뮬레이터 포함 컨테이너 시작

```bash
npm run docker:up
# 또는
docker compose up --build
```

### 테스트 실행

```bash
npm run docker:test
```

### 타입 체크 / 린트

```bash
npm run docker:typecheck
npm run docker:lint
```

---

## React Native 앱 실행

```bash
# Metro 번들러 시작
npm start

# iOS
npm run ios

# Android
npm run android
```

---

## 에뮬레이터 UI 확인

에뮬레이터 실행 후 브라우저에서: **http://localhost:4000**

- Firestore 데이터 확인/수정
- Auth 유저 목록 확인
