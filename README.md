# ZipTaxi

## Project Overview
개인택시 기사님들을 위한 수익 관리 및 목표 달성 도우미 앱입니다.
간편한 수익 기록과 AI 기반의 데이터 분석을 통해 월 목표 매출 달성을 돕습니다.

## Key Features
1. **수익 기록 (Revenue Tracking)**:
   - 일별/월별 운행 수익 입력
   - 카드/현금/앱(카카오/우티) 결제 수단 구분

2. **목표 관리 (Goal Management)**:
   - 월별 목표 매출 설정
   - 실시간 달성률 그래프 시각화

3. **AI 분석 리포트 (AI Insights)**:
   - "사장님, 이번 달 목표까지 30만원 남았어요! 오늘 평소보다 2시간 더 운행하면 달성 가능합니다."
   - 운행 패턴 분석 및 맞춤형 조언 제공 (OpenAI API 활용)

## Tech Stack
- **Frontend**: React Native (TypeScript)
- **Backend/Database**: Firebase (Firestore, Auth)
- **AI**: OpenAI API (GPT-4o-mini)
- **State Management**: React Context API / Zustand

## Setup
1. Clone the repository
2. `npm install`
3. `cd ios && pod install`
4. Create `.env` file with:
   - FIREBASE_API_KEY
   - OPENAI_API_KEY
5. `npm run ios` or `npm run android`

# 작업상황
## ✅ 1-2일차 완료 체크리스트
 ```
 [ ] Node.js, Watchman, Java 설치 [ ] Android Studio 설치 및 SDK 세팅
 [ ] Android 에뮬레이터 생성 및 실행
 [ ] React Native 프로젝트 생성
 [ ] 첫 앱 실행 성공 (Welcome 화면)
 [ ] Firebase 프로젝트 생성
 [ ] Firestore + Authentication 활성화
 [ ] Firebase SDK 설치 및 연동 테스트
 [ ] 프로젝트 폴더 구조 생성
 [ ] React Navigation 설치
 [ ] OpenAI API 키 발급
 [ ] OpenAI 연동 및 테스트 성공
 ```
## 📅 다음 단계 (3일차부터)
 ```
 3일차: 로그인 기능 구현
 4일차: 수입 입력 기능 + Firestore 저장
 5일차: 대시보드 통계 계산
 6일차: 목표 설정 및 진행률 표시
 7일차: 첫 AI 기능 (수입 분석 인사이트)
 ```