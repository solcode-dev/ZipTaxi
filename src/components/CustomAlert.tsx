import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel?: () => void; // Optional cancel button (if needed later)
  onClose: () => void; // Usually just closes the modal
}

export const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  confirmText = '확인',
  onCancel,
  onClose 
}: CustomAlertProps) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertContainer}>
              <View style={styles.contentContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
              </View>
              
                <View style={styles.buttonContainer}>
                  {onCancel && (
                    <TouchableOpacity 
                      style={[styles.button, styles.cancelButton]} 
                      onPress={onCancel}
                    >
                      <Text style={styles.cancelButtonText}>취소</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.confirmButton, onCancel && { flex: 1 }]} 
                    onPress={() => {
                      if (onConfirm) onConfirm();
                      onClose(); // Auto-close on confirm too
                    }}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimmed background
      justifyContent: 'center',
      alignItems: 'center',
    },
    alertContainer: {
      width: width * 0.85,
      backgroundColor: 'white',
      borderRadius: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      overflow: 'hidden',
    },
    contentContainer: {
      padding: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: '#555',
      textAlign: 'center',
      lineHeight: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#EEE',
    },
    button: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButton: {
      backgroundColor: '#FFF',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    cancelButtonText: {
      color: '#999',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
