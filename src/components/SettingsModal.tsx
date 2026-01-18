import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import auth from '@react-native-firebase/auth';
// import { theme } from '../theme';
import { CustomAlert } from './CustomAlert';

const { height } = Dimensions.get('window');

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal = ({ visible, onClose, onLogout }: SettingsModalProps) => {
  const user = auth().currentUser;
  const [alertVisible, setAlertVisible] = useState(false);

  const handleLogoutPress = () => {
    setAlertVisible(true);
  };

  const confirmLogout = () => {
    setAlertVisible(false);
    onClose();
    onLogout();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>설정</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* User Info Section */}
          <View style={styles.section}>
            <Text style={styles.label}>계정 정보</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이메일</Text>
              <Text style={styles.infoValue}>{user?.email || '이메일 정보 없음'}</Text>
            </View>
          </View>

          {/* Actions Section */}
          <View style={[styles.section, { marginTop: 'auto', marginBottom: 40 }]}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogoutPress}
            >
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>앱 버전 1.0.0</Text>
          </View>

          {/* Logout Confirmation Alert */}
          <CustomAlert 
            visible={alertVisible}
            title="로그아웃"
            message="정말 로그아웃 하시겠습니까?"
            confirmText="로그아웃"
            onConfirm={confirmLogout}
            onCancel={() => setAlertVisible(false)}
            onClose={() => setAlertVisible(false)}
          />

        </TouchableOpacity>
      </TouchableOpacity>
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
    height: height * 0.45, // Less height than other modals
    padding: 24,
    width: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 12,
  },
});
