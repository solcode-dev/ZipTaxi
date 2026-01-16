import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {Text, useTheme, Divider} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../state/authStore';
import {CustomTextInput} from '../components/CustomTextInput';
import {CustomButton} from '../components/CustomButton';

export const LoginScreen: React.FC = () => {
  const {t} = useTranslation();
  const theme = useTheme();
  const {login, loginWithKakao, isLoading} = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError(false);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError(false);
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !validateEmail(email)) {
      setEmailError(true);
      Alert.alert('Error', t('auth.errors.auth/invalid-email'));
      return;
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await login(email, password);
    } catch (error: any) {
      const errorCode = error.code || 'default';
      const errorMessage =
        t(`auth.errors.${errorCode}`) || t('auth.errors.default');
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      await loginWithKakao();
    } catch (error: any) {
      const errorMessage = error.message || 'kakao/login-failed';
      const translatedError =
        t(`auth.errors.${errorMessage}`) || t('auth.errors.default');
      Alert.alert('Kakao Login Failed', translatedError);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text
            variant="headlineLarge"
            style={[styles.title, {color: theme.colors.primary}]}>
            ZipTaxi
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('auth.login')}
          </Text>

          <View style={styles.form}>
            <CustomTextInput
              label={t('auth.email')}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              disabled={isLoading}
              testID="email-input"
            />

            <CustomTextInput
              label={t('auth.password')}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              error={passwordError}
              disabled={isLoading}
              testID="password-input"
            />

            <CustomButton
              title={t('auth.loginButton')}
              onPress={handleLogin}
              loading={isLoading}
              testID="login-button"
            />

            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <Divider style={styles.divider} />
            </View>

            <CustomButton
              title={t('auth.kakaoLogin')}
              onPress={handleKakaoLogin}
              mode="outlined"
              loading={isLoading}
              testID="kakao-login-button"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    opacity: 0.5,
  },
});
