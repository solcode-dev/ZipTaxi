
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { theme } from '@theme/index';

import { CustomAlert } from '../components/CustomAlert';

import auth from '@react-native-firebase/auth';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState(''); // This acts as the ID input
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSelectedAutoLogin, setIsSelectedAutoLogin] = useState(false);
  const [fontScale, setFontScale] = useState(1); // 1 = 100%
  const [loading, setLoading] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  // Auto-login check (Optional: can be improved later with Splash screen)
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      if (user) {
         // User is signed in
         // navigation.replace('Dashboard'); // Uncomment to enable auto-login
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  const currentFontSize = (size: number) => size * fontScale;

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Append dummy domain to allow ID-only login
      const emailForAuth = `${email}@ziptaxi.com`;
      
      await auth().signInWithEmailAndPassword(emailForAuth, password);
      
      setLoading(false);
      // Navigate to Dashboard and reset stack so user can't go back to login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (error: any) {
      setLoading(false);
      let errorMessage = '로그인에 실패했습니다. 다시 시도해주세요.';

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

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: currentFontSize(theme.typography.fontSize.xxlarge) }]}>
          사장님의 든든한{'\n'}수익 파트너, ZipTaxi
        </Text>
        <Text style={[styles.subtitle, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}>
          오늘도 안전 운행하세요!{'\n'}목표 수익 달성을 도와드릴게요.
        </Text>
      </View>

      {/* Input Section */}
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
              style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}
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
              <Text style={{color: theme.colors.text.secondary, fontWeight:'bold'}}>
                {isPasswordVisible ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto Login & Font Size Control */}
        <View style={styles.optionsRow}>
            <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setIsSelectedAutoLogin(!isSelectedAutoLogin)}
            >
                <View style={[styles.checkbox, isSelectedAutoLogin && styles.checkboxSelected]}>
                    {isSelectedAutoLogin && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionText}>자동 로그인</Text>
            </TouchableOpacity>

            <View style={styles.fontControl}>
                <TouchableOpacity onPress={() => setFontScale(Math.max(1, fontScale - 0.1))} style={styles.fontButton}>
                    <Text style={styles.fontButtonText}>가</Text>
                </TouchableOpacity>
                <Text style={styles.fontStatusText}>글자 크기</Text>
                <TouchableOpacity onPress={() => setFontScale(Math.min(1.5, fontScale + 0.1))} style={styles.fontButton}>
                    <Text style={[styles.fontButtonText, { fontSize: 18, fontWeight: 'bold' }]}>가</Text>
                </TouchableOpacity>
            </View>
        </View>

        <TouchableOpacity 
        style={[styles.loginButton, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={[styles.loginButtonText, { fontSize: currentFontSize(theme.typography.fontSize.medium) }]}>
          {loading ? '로그인 중...' : '시작하기'}
        </Text>
      </TouchableOpacity>

        <View style={styles.helpLinksContainer}>
            <TouchableOpacity onPress={() => showAlert('알림', '준비 중인 기능입니다.')}>
                <Text style={styles.helpLinkText}>아이디 찾기</Text>
            </TouchableOpacity>
            <View style={styles.helpLinkDivider} />
            <TouchableOpacity onPress={() => showAlert('알림', '준비 중인 기능입니다.')}>
                <Text style={styles.helpLinkText}>비밀번호 찾기</Text>
            </TouchableOpacity>
            <View style={styles.helpLinkDivider} />
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={[styles.helpLinkText, { fontWeight: 'bold', color: theme.colors.primary }]}>회원가입</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.line} />
        </View>

        <View style={styles.socialContainer}>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.colors.social.kakao }]}>
                <Text style={[styles.socialButtonText, { color: '#000000' }]}>카카오 로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.colors.social.naver }]}>
                <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>네이버 로그인</Text>
            </TouchableOpacity>
        </View>

        {/* Custom Alert */}
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
  formCard: {
      width: '100%',
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
    backgroundColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    padding: theme.spacing.lg,
  },
  rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      marginTop: theme.spacing.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  checkboxLabel: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  fontToggle: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
  },
  fontToggleText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
  },
  loginButton: {
    width: '100%', // Added width
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
    marginRight: 8,
  },
  arrowIcon: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 20,
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
    width: '100%', // Added width
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
  socialInitial: {
      fontWeight: 'bold',
      fontSize: 18,
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
  signupLinkText: {
      color: theme.colors.primary,
      fontWeight: '600',
  },
  helpLinkDivider: {
      width: 1,
      height: 12,
      backgroundColor: theme.colors.border,
  },
  // Missing styles added below
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
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
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
});
