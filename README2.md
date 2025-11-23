# 달려라 택시 (DallyeoRaTaxi)
---
택시 기사 수입/지출/운행 효율 분석 모바일 앱

## 소개
---
달려라 택시는 택시 기사의 수입과 지출, 운행 기록을 자동으로 집계하고 효율적으로 분석할 수 있도록 도와주는 크로스 플랫폼 모바일 앱입니다.
- 다양한 플랫폼(카카오, 카드, 현금) 수입 통합 
- GPS 기반 운행 거리 자동 기록 
- 실시간 성과 대시보드 및 목표 달성 관리 
- Supabase 기반 완전 무료 API, SQL 관계형 데이터 활용

## 핵심 기능
---
- 자동 수입 통합 (플랫폼 연동)
- 운행 비용 및 거리 자동/간편 기록 (GPS)
- 성과 대시보드 (일/주/월 분석, 목표 관리)
- 데이터 시각화 및 직관적 인사이트 제공

## 기술 스택
---
| 계층                 | 기술              | 선택 이유                                              |
|--------------------|------------------|-------------------------------------------------------|
| 프론트엔드              | React Native     | JavaScript/TypeScript 기반, iOS/Android 동시 개발, 큰 커뮤니티    |
| 백엔드/DB             | Firebase (Firestore) | NoSQL 실시간 DB, 서버리스, 자동 확장, 무료 플랜 제공              |
| 인증                 | Firebase Authentication | 이메일, 소셜 로그인 간편 통합, JWT 자동 관리                     |
| 위치/지도 | React Native Maps + Geolocation | GPS 추적, 거리 계산, 지도 시각화                                |
| 차트/시각화 | React Native Chart Kit | 수입/지출 그래프, 성과 대시보드 구현                           |
| 상태관리   | React Context 또는 Zustand | 간단한 전역 상태 관리 (초보자 친화적)                           |


## 관련 문서
---
[작성 중인 문서](https://docs.google.com/spreadsheets/d/1sqA4ephbZFJKBs-P2Pvge1yL5gwPARgd9yPqJlXx6H4/edit?usp=sharing)
