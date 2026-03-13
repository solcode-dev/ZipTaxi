import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { CustomAlert } from './CustomAlert';
import type { ExpenseCategory } from '../types/models';

const { height } = Dimensions.get('window');

interface ExpenseInputModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number, category: ExpenseCategory) => void;
}

const CATEGORIES: { key: ExpenseCategory; label: string; subText: string; bg: string; textColor: string; borderColor?: string }[] = [
  { key: 'fuel',        label: '⛽ 주유',      subText: '연료비',       bg: '#FFF3E0', textColor: '#E65100' },
  { key: 'maintenance', label: '🔧 차량 정비',  subText: '수리·점검비',  bg: '#E3F2FD', textColor: '#1565C0' },
  { key: 'meals',       label: '🍱 식비',       subText: '식사·간식',    bg: '#E8F5E9', textColor: '#2E7D32' },
  { key: 'other',       label: '📦 기타',       subText: '기타 지출',    bg: '#F5F5F5', textColor: '#616161', borderColor: '#E0E0E0' },
];

export const ExpenseInputModal = ({ visible, onClose, onConfirm }: ExpenseInputModalProps) => {
  const [step, setStep] = useState<'category' | 'amount'>('category');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [amountStr, setAmountStr] = useState('0');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: () => {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setStep('category');
    setCategory(null);
    setAmountStr('0');
    setAlertVisible(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleCategorySelect = (selected: ExpenseCategory) => {
    setCategory(selected);
    setStep('amount');
    setAmountStr('0');
  };

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setAmountStr(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (key === '000') {
      if (amountStr === '0') return;
      setAmountStr(prev => prev + '000');
    } else {
      setAmountStr(prev => (prev === '0' ? key : prev + key));
    }
  };

  const processConfirm = (amount: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onConfirm(amount, category!);
    handleClose();
  };

  const handleConfirm = () => {
    if (isSubmitting) return;
    const amount = parseInt(amountStr, 10);
    if (amount <= 0 || !category) return;

    if (amount >= 1000000) {
      setAlertConfig({
        title: '금액 확인',
        message: `${amount.toLocaleString()}원이 맞습니까?`,
        onConfirm: () => processConfirm(amount),
      });
      setAlertVisible(true);
    } else {
      processConfirm(amount);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.key === category);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>

          <View style={styles.headerBar}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {step === 'category' ? '지출 카테고리' : '금액 입력'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {step === 'category' ? (
            <View style={styles.stepContainer}>
              <Text style={styles.instruction}>어떤 지출인가요?</Text>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryButton, { backgroundColor: cat.bg }, cat.borderColor && { borderWidth: 1, borderColor: cat.borderColor }]}
                  onPress={() => handleCategorySelect(cat.key)}
                >
                  <Text style={[styles.categoryText, { color: cat.textColor }]}>{cat.label}</Text>
                  <Text style={styles.subText}>{cat.subText}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <View style={[styles.displayArea, { backgroundColor: selectedCat?.bg || '#F5F5F5' }]}>
                <Text style={styles.sourceBadge}>{selectedCat?.label}</Text>
                <Text style={styles.amountDisplay}>
                  {parseInt(amountStr, 10).toLocaleString()}{' '}
                  <Text style={styles.unitDisplay}>원</Text>
                </Text>
              </View>

              <View style={styles.keypadContainer}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'backspace'].map(key => (
                  <TouchableOpacity key={key} style={styles.keyButton} onPress={() => handleKeyPress(key)}>
                    <Text style={styles.keyText}>{key === 'backspace' ? '←' : key}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.confirmButton, (amountStr === '0' || isSubmitting) && styles.disabledButton]}
                onPress={handleConfirm}
                disabled={amountStr === '0' || isSubmitting}
              >
                <Text style={styles.confirmButtonText}>{isSubmitting ? '처리중...' : '입력 완료'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <CustomAlert
            visible={alertVisible}
            title={alertConfig.title}
            message={alertConfig.message}
            confirmText="네, 맞습니다"
            onConfirm={alertConfig.onConfirm}
            onCancel={() => setAlertVisible(false)}
            onClose={() => setAlertVisible(false)}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    padding: 20,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#999',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepContainer: {
    flex: 1,
  },
  instruction: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  categoryButton: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 14,
    marginTop: 4,
    color: '#555',
    opacity: 0.8,
  },
  displayArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 20,
    marginBottom: 20,
  },
  sourceBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  unitDisplay: {
    fontSize: 20,
    color: '#666',
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  keyButton: {
    width: '31%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#E53935',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#DDD',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
