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
2. `npx react-native run-android` 실행