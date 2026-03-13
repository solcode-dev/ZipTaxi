# ZipTaxi TODO

## 배포 전 체크리스트
- [ ] 에뮬레이터 테스트 통과 확인
- [ ] Firestore 보안 규칙 최종 검토
- [ ] .env 환경변수 프로덕션 값으로 교체
- [ ] Firebase Functions 프로덕션 배포
- [ ] iOS / Android 빌드 테스트

---

## 운행효율 탭 개선 (완료)
- [x] 빈 상태 안내 문구 (-- → 설명 텍스트)
- [x] 입력 문구 수정 ("오늘" → "이번")
- [x] 분 필드 유효성 검사 (0~59 clamp)
- [x] 저장 완료 토스트 메시지
- [x] 전월 대비 증감 표시 (▲/▼)
- [x] 운행 패턴 인사이트 (단거리 시내형 / 혼합형 / 장거리 고속형)

---

## 예외처리 개선 (완료)
- [x] `throw new Error()` 로 교체 (훅 3개)
- [x] `onSnapshot` 에러 핸들러 추가
- [x] `setDoc` / `updateDoc` 에러 처리
- [x] `Toast` useEffect stale closure 수정

---

## DB 마이그레이션 (단계별)

### 1단계 — Firebase 유지, 배포 (현재)
- 현재 구조 그대로 배포
- 유저 반응 및 사용 패턴 검증

### 2단계 — Supabase 전환 (유저 ~300명)
- [ ] Supabase 프로젝트 생성
- [ ] 스키마 설계 (원본 데이터만 쌓는 구조로 변경)
  ```sql
  revenues  (id, user_id, amount, source, created_at)
  expenses  (id, user_id, amount, category, created_at)
  drivings  (id, user_id, minutes, distance_km, created_at)
  ```
- [ ] Materialized View로 월별 집계 처리
- [ ] `prevMonthRevenue` 수동 스냅샷 로직 제거
- [ ] useUserDoc / useRevenueTracker / useExpenseTracker / useDrivingStats → Supabase client로 교체
- [ ] Firebase Auth → Supabase Auth 교체
- [ ] Firebase Functions → Supabase Edge Functions 교체
- [ ] 기존 유저 데이터 마이그레이션
- [ ] Firebase 프로젝트 종료

### 3단계 — 아키텍처 개선 (유저 ~2,000명)
- [ ] Supabase Pro → Team 플랜 업그레이드
- [ ] PgBouncer 커넥션 풀링 설정
- [ ] 인덱스 최적화 (user_id + created_at)
- [ ] 실시간 구독 구조 검토 (본인 데이터만 구독)

### 4단계 — 대규모 (유저 ~10,000명)
- [ ] Supabase Team 플랜 유지 or 전용 PostgreSQL 인스턴스 검토
- [ ] 어드민 집계 대시보드 설계
- [ ] 읽기/쓰기 분리 검토

---

## 기타 개선 아이디어
- [ ] 운행 기록 히스토리 화면
- [ ] 월별 수입/지출 추이 차트
- [ ] 푸시 알림 (일일 목표 미달성 시)
- [ ] 다크 모드 지원
