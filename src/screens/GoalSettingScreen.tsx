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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { CustomAlert } from '../components/CustomAlert';

export const GoalSettingScreen = ({ navigation, route }: any) => {
  // Get initial goal from params if available
  const initialGoal = route.params?.initialGoal || 0;
  
  const [goalAmount, setGoalAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  useEffect(() => {
    if (initialGoal > 0) {
      setGoalAmount(initialGoal.toString());
    }
  }, [initialGoal]);

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const formatNumber = (num: string) => {
    // 숫자가 아니면 제거
    const numericValue = num.replace(/[^0-9]/g, '');
    // 콤마 추가
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleInputChange = (text: string) => {
    // Keep only numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setGoalAmount(numericValue);
  };

  const handleSave = async () => {
    if (!goalAmount || parseInt(goalAmount) === 0) {
      showAlert('알림', '목표 금액을 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      const user = auth().currentUser;
      if (user) {
        await firestore().collection('users').doc(user.uid).update({
          monthlyGoal: parseInt(goalAmount),
        });
        
        setLoading(false);
        // Go back to Dashboard
        navigation.goBack();
      } else {
        setLoading(false);
        showAlert('오류', '로그인 정보가 없습니다.');
      }
    } catch (error) {
      console.error(error);
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
          
          <View style={styles.header}>
            <Text style={styles.title}>이번 달 목표 수입 설정</Text>
            <Text style={styles.subtitle}>사장님, 이번 달에는 얼마를 벌고 싶으신가요?</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>목표 금액</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="금액을 입력해 주세요"
                placeholderTextColor={theme.colors.text.placeholder}
                keyboardType="numeric"
                value={formatNumber(goalAmount)}
                onChangeText={handleInputChange}
                autoFocus={true}
              />
              <Text style={styles.unitText}>원</Text>
            </View>
            <Text style={styles.helperText}>언제든 다시 수정할 수 있어요. 편하게 입력해주세요.</Text>
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity 
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? '저장 중...' : '이 목표로 도전하기 🚀'}
            </Text>
          </TouchableOpacity>

        </View>
      </TouchableWithoutFeedback>

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
  saveButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
