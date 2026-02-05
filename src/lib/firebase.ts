import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * [Firebase 서비스 레이어]
 * 이 파일은 앱 전체에서 사용되는 Firebase 인스턴스를 중앙 집중식으로 관리합니다.
 * 직접적인 라이브러리 의존성을 한 곳으로 모아 코드의 결합도를 낮추고
 * 향후 유지보수 및 마이그레이션을 용이하게 합니다.
 */

// 인증(Auth) 인스턴스 초기화
export const firebaseAuth = auth();

// 데이터베이스(Firestore) 인스턴스 초기화
export const firebaseDb = firestore();

// Firestore에서 사용하는 유틸리티 함수들을 익스포트하여 일관된 사용을 유도합니다.
export const { FieldValue, Timestamp } = firestore;

/**
 * @description 현재 로그인된 사용자의 정보를 반환합니다.
 */
export const getCurrentUser = () => firebaseAuth.currentUser;

/**
 * @description 서버 시간을 기준으로 한 타임스탬프를 생성합니다.
 */
export const getServerTimestamp = () => firestore.FieldValue.serverTimestamp();
