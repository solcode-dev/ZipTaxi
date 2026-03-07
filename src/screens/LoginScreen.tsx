
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { theme } from '@theme/index';

import { CustomAlert } from '../components/CustomAlert';
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { signInWithSocial } from '../lib/socialAuth';
import type { LoginScreenProps } from '../types/navigation';

/**
 * [로그인 화면 컴포넌트]
 * 사용자의 아이디(이메일 기반)와 비밀번호를 입력받아 로그인을 처리합니다.
 * 글자 크기 조절 기능(시인성 개선)을 포함하고 있습니다.
 */
export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState(''); // 아이디 입력 상태
  const [password, setPassword] = useState(''); // 비밀번호 입력 상태
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // 비밀번호 표시 여부
  const [fontScale, setFontScale] = useState(1); // 글자 크기 배율 (1 = 100%)
  const [loading, setLoading] = useState(false); // 로그인 처리 중 상태

  // 비밀번호 찾기 모달 상태
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetId, setResetId] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // 커스텀 알림창 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  /**
   * @description 알림창을 띄우는 편의 함수
   */
  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  /**
   * [자동 로그인 및 세션 감시]
   * 앱 실행 시 이미 로그인된 사용자가 있는지 확인하고 있다면 대시보드로 이동시킵니다.
   */
  useEffect(() => {
    // onAuthStateChanged 리스너를 통해 로그인 상태 변화를 감시합니다.
    const subscriber = firebaseAuth.onAuthStateChanged(user => {
      if (user) {
        // 이미 로그인된 사용자가 있다면 대시보드 화면으로 즉시 전환합니다.
        navigation.replace('Dashboard');
      }
    });

    // 컴포넌트가 사라질 때 리스너를 해제하여 메모리 누수를 방지합니다.
    return subscriber;
  }, [navigation]);

  /**
   * @description 현재 설정된 배율에 따라 폰트 크기를 계산하여 반환합니다.
   */
  const currentFontSize = (size: number) => size * fontScale;

  /**
   * [로그인 실행 함수]
   * 입력된 아이디와 비밀번호로 Firebase 인증을 시도합니다.
   */
  const handleSocialLogin = async (provider: 'kakao' | 'naver') => {
    setLoading(true);
    try {
      await signInWithSocial(provider);
      // 로그인 성공 시 onAuthStateChanged가 자동으로 Dashboard로 이동시킵니다.
    } catch (error: any) {
      setLoading(false);
      showAlert('로그인 실패', error.message ?? '소셜 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleLogin = async () => {
    // 입력 값 검증
    if (!email || !password) {
      showAlert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // usernames 룩업 테이블에서 아이디에 매핑된 실제 이메일 조회
      const usernameDoc = await firebaseDb.collection('usernames').doc(email).get();
      const usernameData = usernameDoc.data();
      const emailForAuth = usernameData?.email ?? `${email}@ziptaxi.com`; // 구형 계정 하위 호환

      // Firebase 인증 시도
      await firebaseAuth.signInWithEmailAndPassword(emailForAuth, password);
      
      setLoading(false);
      
      // 로그인 성공 시 대시보드로 이동하며, 뒤로가기로 다시 로그인 창에 오지 못하게 스택을 초기화합니다.
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (error: any) {
      setLoading(false);
      let errorMessage = '로그인에 실패했습니다. 다시 시도해주세요.';

      // 에러 코드에 따른 맞춤 메시지 처리
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '아이디 형식이 올바르지 않습니다.';
      } else {
        console.error(error);
      }

      showAlert('로그인 실패', errorMessage);
    }
  };

  /**
   * [비밀번호 재설정 이메일 발송]
   * 아이디를 입력받아 Firebase sendPasswordResetEmail을 호출합니다.
   */
  const handleResetPassword = async () => {
    const trimmed = resetId.trim();
    if (!trimmed) {
      showAlert('알림', '아이디를 입력해주세요.');
      return;
    }

    setResetLoading(true);
    try {
      // usernames 룩업 테이블에서 실제 이메일 조회
      const usernameDoc = await firebaseDb.collection('usernames').doc(trimmed).get();
      const realEmail = usernameDoc.data()?.email as string | undefined;
      if (!realEmail) {
        showAlert('오류', '존재하지 않는 아이디입니다.');
        return;
      }
      await firebaseAuth.sendPasswordResetEmail(realEmail);
      setResetSent(true);
    } catch (error: any) {
      showAlert('오류', '비밀번호 재설정 요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetModalClose = () => {
    setResetModalVisible(false);
    setResetId('');
    setResetSent(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 상단 헤더 섹션: 앱 이름 및 인사말 */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: currentFontSize(theme.typography.fontSize.xxlarge) }]}>
          사장님의 든든한{'\n'}수익 파트너, ZipTaxi
        </Text>
        <Text style={[styles.subtitle, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}>
          오늘도 안전 운행하세요!{'\n'}목표 수익 달성을 도와드릴게요.
        </Text>
      </View>

      {/* 입력 섹션: 아이디 및 비밀번호 */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { fontSize: currentFontSize(theme.typography.fontSize.small) }]}>아이디</Text>
        <TextInput
          style={[styles.input, styles.inputField, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}
          placeholder="아이디를 입력하세요"
          placeholderTextColor={theme.colors.text.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { fontSize: currentFontSize(theme.typography.fontSize.small) }]}>비밀번호</Text>
        <View style={[styles.passwordContainer, styles.inputField]}>
            <TextInput
              style={[styles.input, styles.passwordInput, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={theme.colors.text.placeholder}
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
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

        {/* 설정 행: 글자 크기 조절 버튼 */}
        <View style={styles.optionsRow}>
            <View style={styles.flex1} /> 
            <View style={styles.fontControl}>
                {/* 폰트 축소 버튼 */}
                <TouchableOpacity onPress={() => setFontScale(Math.max(1, fontScale - 0.1))} style={styles.fontButton}>
                    <Text style={styles.fontButtonText}>가</Text>
                </TouchableOpacity>
                <Text style={styles.fontStatusText}>글자 크기</Text>
                {/* 폰트 확대 버튼 */}
                <TouchableOpacity onPress={() => setFontScale(Math.min(1.5, fontScale + 0.1))} style={styles.fontButton}>
                    <Text style={[styles.fontButtonText, styles.fontLargeLabel]}>가</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* 로그인 버튼 */}
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={[styles.loginButtonText, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}>
            {loading ? '로그인 중...' : '시작하기'}
          </Text>
        </TouchableOpacity>

        {/* 하단 보조 메뉴: 아이디/비밀번호 찾기 및 회원가입 */}
        <View style={styles.helpLinksContainer}>
            <TouchableOpacity onPress={() => showAlert('알림', '준비 중인 기능입니다.')}>
                <Text style={styles.helpLinkText}>아이디 찾기</Text>
            </TouchableOpacity>
            <View style={styles.helpLinkDivider} />
            <TouchableOpacity onPress={() => setResetModalVisible(true)}>
                <Text style={styles.helpLinkText}>비밀번호 찾기</Text>
            </TouchableOpacity>
            <View style={styles.helpLinkDivider} />
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={[styles.helpLinkText, styles.highlightSignup]}>회원가입</Text>
            </TouchableOpacity>
        </View>

        {/* 구분선 */}
        <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.line} />
        </View>

        {/* 소셜 로그인 섹션 (추후 구현 예정) */}
        <View style={styles.socialContainer}>
            <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme.colors.social.kakao }, loading && styles.socialButtonDisabled]}
                onPress={() => handleSocialLogin('kakao')}
                disabled={loading}
            >
                <Text style={[styles.socialButtonText, styles.blackText]}>카카오 로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme.colors.social.naver }, loading && styles.socialButtonDisabled]}
                onPress={() => handleSocialLogin('naver')}
                disabled={loading}
            >
                <Text style={[styles.socialButtonText, styles.whiteText]}>네이버 로그인</Text>
            </TouchableOpacity>
        </View>

        {/* 비밀번호 찾기 모달 */}
        <Modal
          visible={resetModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleResetModalClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalBox}>
              {resetSent ? (
                <>
                  <Text style={styles.modalTitle}>이메일 발송 완료</Text>
                  <Text style={styles.modalMessage}>
                    비밀번호 재설정 링크가 발송되었습니다.{'\n'}
                    이메일을 확인해주세요.
                  </Text>
                  <TouchableOpacity style={styles.modalConfirmButton} onPress={handleResetModalClose}>
                    <Text style={styles.modalConfirmText}>확인</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>비밀번호 찾기</Text>
                  <Text style={styles.modalMessage}>
                    가입하신 아이디를 입력하시면{'\n'}비밀번호 재설정 링크를 보내드립니다.
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="아이디를 입력하세요"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={resetId}
                    onChangeText={setResetId}
                    autoCapitalize="none"
                    autoFocus
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={handleResetModalClose}>
                      <Text style={styles.modalCancelText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalConfirmButton, resetLoading && styles.modalButtonDisabled]}
                      onPress={handleResetPassword}
                      disabled={resetLoading}
                    >
                      {resetLoading
                        ? <ActivityIndicator color={theme.colors.text.inverse} size="small" />
                        : <Text style={styles.modalConfirmText}>전송</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* 커스텀 알림 컴포넌트 */}
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setAlertVisible(false)}
        />
        
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  inputField: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginBottom: 20,
  },
  input: {
    padding: theme.spacing.lg,
    color: theme.colors.text.primary,
    minHeight: 60,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    padding: theme.spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  loginButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  loginButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    justifyContent: 'center',
  },
  line: {
      width: 40,
      height: 1,
      backgroundColor: theme.colors.border,
  },
  dividerText: {
      marginHorizontal: 10,
      color: theme.colors.text.placeholder,
      fontSize: 12,
  },
  socialContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 40,
  },
  socialButton: {
      flex: 1,
      height: 50,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
  },
  socialButtonText: {
      fontWeight: 'bold',
      fontSize: 16,
  },
  helpLinksContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
  },
  helpLinkText: {
      color: theme.colors.text.secondary,
      fontSize: 14,
      paddingHorizontal: 8,
  },
  helpLinkDivider: {
      width: 1,
      height: 12,
      backgroundColor: theme.colors.border,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  fontControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fontButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  fontButtonText: {
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  fontStatusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginHorizontal: 8,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    marginBottom: 0,
  },
  eyeIconText: {
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  flex1: {
    flex: 1,
  },
  fontLargeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  highlightSignup: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalMessage: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCancelText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: theme.typography.fontSize.medium,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  modalConfirmText: {
    color: theme.colors.text.inverse,
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize.medium,
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
  blackText: {
    color: '#000000',
  },
  whiteText: {
    color: '#FFFFFF',
  }
});
