import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { theme } from '../theme';

interface DrivingInputModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (minutes: number, distanceKm: number) => void;
}

export const DrivingInputModal = ({ visible, onClose, onConfirm }: DrivingInputModalProps) => {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [distance, setDistance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setHours('');
    setMinutes('');
    setDistance('');
    setIsSubmitting(false);
    onClose();
  };

  const totalMinutes = (parseInt(hours || '0', 10) * 60) + parseInt(minutes || '0', 10);
  const distanceKm = parseFloat(distance || '0');
  const isValid = totalMinutes > 0 || distanceKm > 0;

  const handleConfirm = () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    onConfirm(totalMinutes, distanceKm);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>

          <View style={styles.headerBar}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>운행 기록 입력</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={styles.instruction}>오늘 운행 기록을 입력하세요</Text>

          {/* 운행 시간 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>⏱ 운행 시간</Text>
            <View style={styles.timeRow}>
              <View style={styles.fieldWrapper}>
                <TextInput
                  style={styles.input}
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#CCC"
                  maxLength={2}
                  returnKeyType="next"
                />
                <Text style={styles.fieldUnit}>시간</Text>
              </View>
              <View style={styles.fieldWrapper}>
                <TextInput
                  style={styles.input}
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#CCC"
                  maxLength={2}
                />
                <Text style={styles.fieldUnit}>분</Text>
              </View>
            </View>
          </View>

          {/* 주행 거리 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🚗 주행 거리</Text>
            <View style={styles.fieldWrapper}>
              <TextInput
                style={[styles.input, styles.inputFull]}
                value={distance}
                onChangeText={setDistance}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#CCC"
                maxLength={7}
              />
              <Text style={styles.fieldUnit}>km</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, !isValid && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={!isValid || isSubmitting}
          >
            <Text style={styles.confirmButtonText}>
              {isSubmitting ? '저장 중...' : '입력 완료'}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
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
    padding: 24,
    paddingBottom: 40,
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
  instruction: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 14,
    textAlign: 'center',
  },
  inputFull: {
    textAlign: 'left',
  },
  fieldUnit: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
    marginLeft: 4,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#DDD',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
