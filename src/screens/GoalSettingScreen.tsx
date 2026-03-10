import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { theme } from '../theme';

// 중앙 집중식 Firebase 서비스 레이어에서 필요한 기능을 가져옵니다.
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { doc, updateDoc } from '@react-native-firebase/firestore';

import { CustomAlert } from '../components/CustomAlert';
import { formatNumberInput, parseNumericInput } from '../utils/formatUtils';
import type { GoalSettingScreenProps } from '../types/navigation';

/**
 * [목표 설정 화면 컴포넌트]
 * 사용자가 월간 목표 수익을 설정하거나 수정할 수 있는 화면입니다.
 */
export const GoalSettingScreen = ({ navigation, route }: GoalSettingScreenProps) => {
  // 이전 화면(대시보드)에서 전달받은 기존 목표 금액
  const initialGoal = route.params?.initialGoal || 0;
  const currentMonth = new Date().getMonth() + 1;
  
  const [goalAmount, setGoalAmount] = useState(''); // 입력 중인 숫자값 (문자열 타입으로 관리)
  const [loading, setLoading] = useState(false); // 저장 처리 중 상태
  
  // 커스텀 알림창 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  // 초기 로드 시 전달받은 목표 금액 세팅
  useEffect(() => {
    if (initialGoal > 0) {
      setGoalAmount(initialGoal.toString());
    }
  }, [initialGoal]);

  /**
   * @description 알림창 호출 함수
   */
  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  /**
   * [입력 변경 처리 함수]
   * 쉼표가 이미 포함된 텍스트에서 숫자만 추출하여 상태값에 저장합니다.
   */
  const handleInputChange = (text: string) => {
    setGoalAmount(parseNumericInput(text));
  };

  /**
   * [목표 저장 함수]
   * 입력된 목표 금액을 Firebase Firestore에 저장하고 이전 화면으로 돌아갑니다.
   */
  const handleSave = async () => {
    // 값 검증: 입력값이 없거나 0인 경우
    if (!goalAmount || parseInt(goalAmount, 10) === 0) {
      showAlert('알림', '목표 금액을 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      const user = firebaseAuth.currentUser;
      if (user) {
        // Firestore의 해당 사용자 문서 참조 생성
        const userRef = doc(firebaseDb, 'users', user.uid);
        
        // 목표 금액(monthlyGoal) 필드 업데이트
        await updateDoc(userRef, {
          monthlyGoal: parseInt(goalAmount, 10),
        });
        
        setLoading(false);
        // 저장 성공 시 이전 화면(대시보드)으로 이동
        navigation.goBack();
      } else {
        setLoading(false);
        showAlert('오류', '로그인 정보가 없습니다.');
      }
    } catch (error) {
      console.error('목표 저장 에러:', error);
      setLoading(false);
      showAlert('오류', '저장 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          
          {/* 상단 헤더: 제목 및 안내 문구 */}
          <View style={styles.header}>
            <Text style={styles.title}>{currentMonth}월 목표 수입 설정</Text>
            <Text style={styles.subtitle}>사장님, {currentMonth}월에는 얼마를 벌고 싶으신가요?</Text>
          </View>

          {/* 입력 센션: 목표 금액 입력 필드 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>목표 금액</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="금액을 입력해 주세요"
                placeholderTextColor={theme.colors.text.placeholder}
                keyboardType="numeric"
                value={formatNumberInput(goalAmount)}
                onChangeText={handleInputChange}
                autoFocus={true}
              />
              <Text style={styles.unitText}>원</Text>
            </View>
            <Text style={styles.helperText}>언제든 다시 수정할 수 있어요. 편하게 입력해주세요.</Text>
          </View>

          {/* 중앙 여백 확보 */}
          <View style={styles.spacer} />

          {/* 하단 저장 버튼 */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? '저장 중...' : `${currentMonth}월 목표로 설정하기 🚀`}
            </Text>
          </TouchableOpacity>

        </View>
      </TouchableWithoutFeedback>

      {/* 알림창 컴포넌트 */}
      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    paddingBottom: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    padding: 0,
  },
  unitText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#888',
  },
  spacer: {
    flex: 1,
  },
  saveButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
});
