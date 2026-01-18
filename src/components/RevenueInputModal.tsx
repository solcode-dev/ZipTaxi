import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme';
import { CustomAlert } from './CustomAlert';

const { height } = Dimensions.get('window');

type RevenueSource = 'kakao' | 'card' | 'other' | null;

interface RevenueInputModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number, source: RevenueSource) => void;
}

export const RevenueInputModal = ({ visible, onClose, onConfirm }: RevenueInputModalProps) => {
  const [step, setStep] = useState<'source' | 'amount'>('source');
  const [source, setSource] = useState<RevenueSource>(null);
  const [amountStr, setAmountStr] = useState('0');

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (existing states)

  // Reset state when opening (handled by parent or effect, but here we do simple reset on close)
  const handleClose = () => {
    setStep('source');
    setSource(null);
    setAmountStr('0');
    setAlertVisible(false);
    setIsSubmitting(false); // Reset submitting state
    onClose();
  };

  const handleSourceSelect = (selected: RevenueSource) => {
    setSource(selected);
    setStep('amount');
    setAmountStr('0');
  };

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '000') {
        if (amountStr === '0') return; // Don't add 000 to 0
        setAmountStr(prev => prev + '000');
    } else {
      setAmountStr(prev => (prev === '0' ? key : prev + key));
    }
  };

  const processConfirm = (amount: number) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      
      // Use setTimeout to ensure UI updates before closing or just rely on parent
      // But typically we just fire and close.
      onConfirm(amount, source!);
      handleClose();
  };

  const handleConfirm = () => {
    if (isSubmitting) return; // Prevent double click
    
    const amount = parseInt(amountStr, 10);
    if (amount <= 0 || !source) return;

    // High Amount Check (e.g., 1,000,000 KRW)
    if (amount >= 1000000) {
        setAlertConfig({
            title: "금액 확인",
            message: `${amount.toLocaleString()}원이 맞습니까?\n일반적인 요금보다 큽니다.`,
            onConfirm: () => processConfirm(amount)
        });
        setAlertVisible(true);
    } else {
        processConfirm(amount);
    }
  };

  const formatCurrency = (str: string) => {
    return parseInt(str, 10).toLocaleString();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {step === 'source' ? '수입원 선택' : '금액 입력'}
            </Text>
            <View style={{width: 40}} />
          </View>

          {step === 'source' ? (
            /* STEP 1: Source Selection */
            <View style={styles.stepContainer}>
              <Text style={styles.instruction}>어디서 입금되었나요?</Text>
              
              <TouchableOpacity 
                style={[styles.sourceButton, styles.kakaoButton]} 
                onPress={() => handleSourceSelect('kakao')}
              >
                <Text style={styles.kakaoText}>🟡 카카오T</Text>
                <Text style={styles.subText}>정산 예정금 포함</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sourceButton, styles.cardButton]} 
                onPress={() => handleSourceSelect('card')}
              >
                <Text style={styles.cardText}>🔵 카드/현금 걸제</Text>
                <Text style={styles.subText}>직접 받은 요금</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sourceButton, styles.otherButton]} 
                onPress={() => handleSourceSelect('other')}
              >
                <Text style={styles.otherText}>⚪ 기타 수입</Text>
                <Text style={styles.subText}>팁, 보너스 등</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* STEP 2: Amount Input */
            <View style={styles.stepContainer}>
               {/* Display */}
              <View style={[styles.displayArea, 
                source === 'kakao' ? { backgroundColor: '#FFE812' } : 
                source === 'card' ? { backgroundColor: '#E3F2FD' } : 
                { backgroundColor: '#F5F5F5' }
              ]}>
                <Text style={styles.sourceBadge}>
                  {source === 'kakao' ? '🟡 카카오T' : source === 'card' ? '🔵 카드/현금' : '⚪ 기타'}
                </Text>
                <Text style={styles.amountDisplay}>{formatCurrency(amountStr)} <Text style={styles.unitDisplay}>원</Text></Text>
              </View>

               {/* Keypad */}
              <View style={styles.keypadContainer}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'backspace'].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.keyButton}
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text style={styles.keyText}>{key === 'backspace' ? '←' : key}</Text>
                  </TouchableOpacity>
                ))}
              </View>

               {/* Confirm Button */}
              <TouchableOpacity 
                style={[
                    styles.confirmButton, 
                    (amountStr === '0' || isSubmitting) && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={amountStr === '0' || isSubmitting}
              >
                <Text style={styles.confirmButtonText}>
                    {isSubmitting ? "처리중..." : "입력 완료"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Custom Alert Overlay */}
          <CustomAlert 
            visible={alertVisible}
            title={alertConfig.title}
            message={alertConfig.message}
            confirmText="네, 맞습니다"
            onConfirm={alertConfig.onConfirm}
            onCancel={() => setAlertVisible(false)} // Add cancel action
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
  sourceButton: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kakaoButton: {
    backgroundColor: '#FFE812',
  },
  cardButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  otherButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  kakaoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3C1E1E',
  },
  cardText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  otherText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
  },
  subText: {
    fontSize: 14,
    marginTop: 4,
    color: '#555',
    opacity: 0.8,
  },
  
  // Step 2 Styles
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
    backgroundColor: theme.colors.primary,
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
