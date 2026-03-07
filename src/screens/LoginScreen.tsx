
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

// 아이디로 Firebase Auth 이메일을 조회합니다. 신규 계정은 usernames 룩업, 구형은 더미 도메인 폴백.
const resolveEmail = async (username: string): Promise<string> => {
  const doc = await firebaseDb.collection('usernames').doc(username).get();
  return (doc.data()?.email as string | undefined) ?? `${username}@ziptaxi.com`;
};

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [loading, setLoading] = useState(false);

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  // 로그인 상태 감시 — 인증 성공 시 onAuthStateChanged가 Dashboard로 이동
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(user => {
      if (user) navigation.replace('Dashboard');
    });
    return unsubscribe;
  }, [navigation]);

  const currentFontSize = (size: number) => size * fontScale;

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const emailForAuth = await resolveEmail(username);
      await firebaseAuth.signInWithEmailAndPassword(emailForAuth, password);
      // 성공 시 onAuthStateChanged가 Dashboard로 이동시킵니다.
    } catch (error: any) {
      const isInvalidCredential =
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password';

      const message = isInvalidCredential
        ? '아이디 또는 비밀번호가 올바르지 않습니다.'
        : '로그인에 실패했습니다. 다시 시도해주세요.';

      showAlert('로그인 실패', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'kakao' | 'naver') => {
    setLoading(true);
    try {
      await signInWithSocial(provider);
    } catch (error: any) {
      setLoading(false);
      showAlert('로그인 실패', error.message ?? '소셜 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleResetPassword = async () => {
    const trimmed = resetUsername.trim();
    if (!trimmed) {
      showAlert('알림', '아이디를 입력해주세요.');
      return;
    }

    setResetLoading(true);
    try {
      const doc = await firebaseDb.collection('usernames').doc(trimmed).get();
      const realEmail = doc.data()?.email as string | undefined;
      if (!realEmail) {
        showAlert('오류', '존재하지 않는 아이디입니다.');
        return;
      }
      await firebaseAuth.sendPasswordResetEmail(realEmail);
      setResetModalVisible(false);
      setResetUsername('');
      showAlert('이메일 발송 완료', '비밀번호 재설정 링크를 이메일로 보내드렸습니다.');
    } catch {
      showAlert('오류', '비밀번호 재설정 요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: currentFontSize(theme.typography.fontSize.xxlarge) }]}>
          사장님의 든든한{'\n'}수익 파트너, ZipTaxi
        </Text>
        <Text style={[styles.subtitle, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}>
          오늘도 안전 운행하세요!{'\n'}목표 수익 달성을 도와드릴게요.
        </Text>
      </View>

      {/* 입력 필드 */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { fontSize: currentFontSize(theme.typography.fontSize.small) }]}>아이디</Text>
        <TextInput
          style={[styles.input, styles.inputField, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}
          placeholder="아이디를 입력하세요"
          placeholderTextColor={theme.colors.text.placeholder}
          value={username}
          onChangeText={setUsername}
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
          <TouchableOpacity style={styles.eyeButton} onPress={() => setIsPasswordVisible(v => !v)}>
            <Text style={styles.eyeIconText}>{isPasswordVisible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 글자 크기 조절 */}
      <View style={styles.optionsRow}>
        <View style={styles.flex1} />
        <View style={styles.fontControl}>
          <TouchableOpacity onPress={() => setFontScale(s => Math.max(1, s - 0.1))} style={styles.fontButton}>
            <Text style={styles.fontButtonText}>가</Text>
          </TouchableOpacity>
          <Text style={styles.fontStatusText}>글자 크기</Text>
          <TouchableOpacity onPress={() => setFontScale(s => Math.min(1.5, s + 0.1))} style={styles.fontButton}>
            <Text style={[styles.fontButtonText, styles.fontLargeLabel]}>가</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 로그인 버튼 */}
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={[styles.loginButtonText, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}>
          {loading ? '로그인 중...' : '시작하기'}
        </Text>
      </TouchableOpacity>

      {/* 보조 링크 */}
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

      {/* 소셜 로그인 */}
      <View style={styles.socialContainer}>
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: theme.colors.social.kakao }, loading && styles.buttonDisabled]}
          onPress={() => handleSocialLogin('kakao')}
          disabled={loading}
        >
          <Text style={[styles.socialButtonText, styles.blackText]}>카카오 로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: theme.colors.social.naver }, loading && styles.buttonDisabled]}
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
        onRequestClose={() => setResetModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>비밀번호 찾기</Text>
            <Text style={styles.modalMessage}>
              가입하신 아이디를 입력하시면{'\n'}비밀번호 재설정 링크를 보내드립니다.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="아이디를 입력하세요"
              placeholderTextColor={theme.colors.text.placeholder}
              value={resetUsername}
              onChangeText={setResetUsername}
              autoCapitalize="none"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setResetModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, resetLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading
                  ? <ActivityIndicator color={theme.colors.text.inverse} size="small" />
                  : <Text style={styles.modalConfirmText}>전송</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    marginBottom: 0,
  },
  eyeButton: {
    padding: theme.spacing.lg,
  },
  eyeIconText: {
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  flex1: {
    flex: 1,
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
  },
  fontButtonText: {
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  fontLargeLabel: {
    fontSize: 18,
  },
  fontStatusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginHorizontal: 8,
  },
  loginButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 18,
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
  buttonDisabled: {
    opacity: 0.7,
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
  highlightSignup: {
    fontWeight: 'bold',
    color: theme.colors.primary,
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
  blackText: { color: '#000000' },
  whiteText: { color: '#FFFFFF' },
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
});
