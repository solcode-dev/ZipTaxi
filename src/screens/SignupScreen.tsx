
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

import auth, { createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import { CustomAlert } from '../components/CustomAlert';

export const SignupScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: undefined as undefined | (() => void), confirmText: '확인' });

  const showAlert = (title: string, message: string, onConfirm?: () => void, confirmText = '확인') => {
    setAlertConfig({ title, message, onConfirm, confirmText });
    setAlertVisible(true);
  };

  const handleSignup = async () => {
    // Basic validation
    if (!name || !id || !password || !confirmPassword) {
      showAlert('알림', '모든 항목을 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setLoading(true);
    try {
      // Firebase Auth (Create User)
      // Append dummy domain to allow "ID-only" signup with Firebase Email Auth
      const emailForAuth = `${id}@ziptaxi.com`;
      
      // Use modular syntax
      const userCredential = await createUserWithEmailAndPassword(auth(), emailForAuth, password);
      const user = userCredential.user;

      // Firestore (Save User Data)
      // Use modular syntax for Firestore as well to prevent further warnings
      const db = firestore();
      await db.collection('users').doc(user.uid).set({
        name: name,
        username: id,
        email: emailForAuth,
        createdAt: firestore.FieldValue.serverTimestamp(), // Corrected to use firestore.FieldValue.serverTimestamp()
        role: 'driver',
      });

      setLoading(false);
      showAlert('가입 완료', '회원가입이 성공적으로 완료되었습니다!', () => navigation.goBack(), '로그인하러 가기');

    } catch (error: any) {
      setLoading(false);
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
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
      <Text style={styles.headerTitle}>회원가입</Text>
      <Text style={styles.headerSubtitle}>
        ZipTaxi와 함께{'\n'}수익 관리를 시작해보세요.
      </Text>

      <View style={styles.form}>
        {/* Name Input */}
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

        {/* ID Input */}
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

        {/* Password Input */}
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

        {/* Password Confirm Input */}
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
                <Text style={{color: theme.colors.text.secondary, fontWeight:'bold'}}>
                    {isPasswordVisible ? '🙈' : '👁️'}
                </Text>
                </TouchableOpacity>
            </View>
        </View>

        <TouchableOpacity 
            style={[styles.signupButton, loading && { opacity: 0.7 }]} 
            onPress={handleSignup}
            disabled={loading}
        >
          <Text style={styles.signupButtonText}>
              {loading ? '가입 처리 중...' : '가입하기'}
          </Text>
        </TouchableOpacity>
        
      </View>

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
});
