
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { theme } from '@theme/index';

// 중앙 집중식 Firebase 서비스 레이어에서 필요한 기능을 가져옵니다.
import { firebaseAuth, firebaseDb, getServerTimestamp } from '../lib/firebase';
// Firebase SDK에서 직접 필요한 타입이나 함수가 있다면 가져옵니다.
import { createUserWithEmailAndPassword } from '@react-native-firebase/auth';

import { CustomAlert } from '../components/CustomAlert';
import type { SignupScreenProps } from '../types/navigation';

/**
 * [회원가입 화면 컴포넌트]
 * 새로운 사용자를 등록하고 초기 프로필 정보를 Firestore에 저장합니다.
 */
export const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const [name, setName] = useState(''); // 사용자 이름 상태
  const [id, setId] = useState(''); // 희망 아이디 상태
  const [password, setPassword] = useState(''); // 비밀번호 상태
  const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인 상태
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // 비밀번호 표시 여부
  const [loading, setLoading] = useState(false); // 가입 처리 중 상태

  // 커스텀 알림창 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    title: '', 
    message: '', 
    onConfirm: undefined as undefined | (() => void), 
    confirmText: '확인' 
  });

  /**
   * @description 알림창을 띄우는 편의 함수
   */
  const showAlert = (title: string, message: string, onConfirm?: () => void, confirmText = '확인') => {
    setAlertConfig({ title, message, onConfirm, confirmText });
    setAlertVisible(true);
  };

  /**
   * [회원가입 처리 함수]
   * 1. 폼 유효성 검사
   * 2. Firebase Auth를 통한 계정 생성
   * 3. Firestore에 사용자 기본 정보 저장
   */
  const handleSignup = async () => {
    // 1단계: 필수 입력값 확인
    if (!name || !id || !password || !confirmPassword) {
      showAlert('알림', '모든 항목을 입력해주세요.');
      return;
    }
    
    // 2단계: 비밀번호 일치 여부 확인
    if (password !== confirmPassword) {
      showAlert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setLoading(true);
    try {
      // 기사님들의 아이디를 이메일 형식으로 변환 (Firebase 인증 요구사항 대응)
      const emailForAuth = `${id}@ziptaxi.com`;
      
      // 3단계: Firebase 인증 계정 생성
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, emailForAuth, password);
      const user = userCredential.user;

      // 4단계: Firestore에 사용자 프로필 정보 저장
      await firebaseDb.collection('users').doc(user.uid).set({
        name: name,
        username: id,
        email: emailForAuth,
        createdAt: getServerTimestamp(), // 서버 시간을 기준으로 생성일 저장
        role: 'driver',
        // 수익 관련 초기 데이터 세팅
        totalRevenue: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        monthlyGoal: 0,
      });

      setLoading(false);
      showAlert(
        '가입 완료', 
        '회원가입이 성공적으로 완료되었습니다!', 
        () => navigation.goBack(), 
        '로그인하러 가기'
      );

    } catch (error: any) {
      setLoading(false);
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      // Firebase 에러 코드에 따른 한국어 메시지 대응
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 아이디입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '아이디에 사용할 수 없는 문자가 포함되어 있습니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호는 6자리 이상이어야 합니다.';
      } else {
          console.error(error);
      }

      showAlert('오류', errorMessage);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 헤더 섹션: 안내 문구 */}
      <Text style={styles.headerTitle}>회원가입</Text>
      <Text style={styles.headerSubtitle}>
        ZipTaxi와 함께{'\n'}수익 관리를 시작해보세요.
      </Text>

      <View style={styles.form}>
        {/* 이름 입력 필드 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 홍길동"
            placeholderTextColor={theme.colors.text.placeholder}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 아이디 입력 필드 */}
        <View style={styles.inputContainer}>
            <Text style={styles.label}>아이디</Text>
            <TextInput
                style={styles.input}
                placeholder="사용하실 아이디를 입력하세요"
                placeholderTextColor={theme.colors.text.placeholder}
                value={id}
                onChangeText={setId}
                autoCapitalize="none"
            />
        </View>

        {/* 비밀번호 입력 필드 */}
        <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="비밀번호"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                />
            </View>
        </View>

        {/* 비밀번호 확인 입력 필드 및 눈 아이콘 버튼 */}
        <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="비밀번호를 한 번 더 입력하세요"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                <Text style={styles.eyeIconText}>
                    {isPasswordVisible ? '🙈' : '👁️'}
                </Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* 가입하기 버튼 */}
        <TouchableOpacity 
            style={[styles.signupButton, loading && styles.signupButtonDisabled]} 
            onPress={handleSignup}
            disabled={loading}
        >
          <Text style={styles.signupButtonText}>
              {loading ? '가입 처리 중...' : '가입하기'}
          </Text>
        </TouchableOpacity>
        
      </View>

      {/* 커스텀 알림 컴포넌트 */}
      <CustomAlert 
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
          confirmText={alertConfig.confirmText}
          onClose={() => setAlertVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxlarge,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.lg,
  },
  inputContainer: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.medium,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.large,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 56,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  eyeButton: {
    padding: theme.spacing.md,
  },
  signupButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    minHeight: 60,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.large,
    fontWeight: 'bold',
  },
  eyeIconText: {
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  signupButtonDisabled: {
    opacity: 0.7,
  }
});
