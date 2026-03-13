import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';

import { firebaseAuth } from '../lib/firebase';
import { CustomAlert } from './CustomAlert';

const { height } = Dimensions.get('window');

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal = ({ visible, onClose, onLogout }: SettingsModalProps) => {
  const user = firebaseAuth.currentUser;
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);

  const handleLogoutConfirm = () => {
    setLogoutAlertVisible(false);
    onClose();
    onLogout();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>설정</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>계정 정보</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>아이디(이메일)</Text>
              <Text style={styles.infoValue}>{user?.email ?? '정보 없음'}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              onPress={() => setLogoutAlertVisible(true)}
            >
              <Text style={styles.logoutText}>로그아웃</Text>
            </Pressable>
            <Text style={styles.version}>앱 버전 1.0.0</Text>
          </View>
        </View>
      </View>

      <CustomAlert
        visible={logoutAlertVisible}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutAlertVisible(false)}
        onClose={() => setLogoutAlertVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.45,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIcon: {
    fontSize: 20,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  footer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButtonPressed: {
    backgroundColor: '#FFEBEE',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#AAA',
  },
});
