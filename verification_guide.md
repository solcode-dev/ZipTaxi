# ZipTaxi Firebase 모듈화 리팩토링 검증 계획

본 문서는 Firebase Modular SDK 전환 작업 완료 후, 기능의 정상 작동 여부를 확인하기 위한 검증 절차를 안내합니다.

## [1단계] 앱 빌드 및 실행 확인
1. **Metro Bundler 시작**: `npx react-native start`
2. **앱 빌드**: `npx react-native run-ios` 또는 `npx react-native run-android`
   > [!IMPORTANT]
   > 빌드 시 Firebase SDK 버전 관련 충돌이 발생하는지 확인하세요.

## [2단계] 핵심 기능 테스트 시나리오

### 1. 인증 (Authentication)
- [ ] **회원가입**: `SignupScreen`에서 새 계정 생성 및 Firestore `users` 컬렉션에 문서 생성 확인.
- [ ] **로그인/로그아웃**: `LoginScreen` 로그인 후 `SettingsModal`에서 로그아웃 처리 정상 여부.
- [ ] **인증 상태 유지**: 앱 재시작 시 로그인 상태가 유지되는지 확인.

### 2. 수익 관리 (Firestore)
- [ ] **수익 입력**: 메인 화면 '+' 버튼을 통해 수익 입력 시 `revenues` 컬렉션에 데이터 기록 확인.
- [ ] **대시보드 실시간 갱신**: 데이터 입력 즉시 대시보드의 '이번 달 총 수입' 및 '주간 트렌드' 차트가 갱신되는지 확인.
- [ ] **상세 내역 조회 및 삭제**: '이번 달 총 수입' 카드 클릭 시 내역 모달이 뜨고, 특정 내역 삭제 시 즉시 반영되는지 확인.

### 3. 목표 설정 및 연속 달성 (Logic)
- [ ] **월 목표 변경**: `GoalSettingScreen`에서 목표 수정 시 Firestore `users` 문서의 `monthlyGoal` 필드가 업데이트되는지 확인.
- [ ] **스트릭(Streak) 계산**: 오늘 목표 달성 시 스트릭이 증가하고, 7일 연속 달성 시 `freezeCount`가 증가하는지 확인.

## [3단계] 코드 퀄리티 확인
- [ ] **한글 주석**: 각 파일의 주요 로직(`useEffect`, `onSnapshot` 등)에 한글 주석이 상세히 추가되었는지 확인.
- [ ] **린트 에러**: VS Code 상에서 인라인 스타일 관련 노란색 밑줄(경고)이 사라졌는지 확인.
