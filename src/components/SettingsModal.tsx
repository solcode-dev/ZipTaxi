import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';

// 중앙 집중식 Firebase 서비스 레이어에서 인증 인스턴스를 가져옵니다.
import { firebaseAuth } from '../lib/firebase';
import { CustomAlert } from './CustomAlert';

const { height } = Dimensions.get('window');

interface SettingsModalProps {
  visible: boolean; // 모달 표시 여부
  onClose: () => void; // 모달 닫기 콜백
  onLogout: () => void; // 로그아웃 성공 시 콜백
}

/**
 * [설정 모달 컴포넌트]
 * 사용자의 계정 정보를 보여주고 로그아웃 기능을 제공합니다.
 * 앱의 메인 화면 우측 상단 기어 아이콘을 통해 진입합니다.
 */
export const SettingsModal = ({ visible, onClose, onLogout }: SettingsModalProps) => {
  // 현재 로그인된 사용자의 정보를 서비스 레이어를 통해 가져옵니다.
  const user = firebaseAuth.currentUser;
  
  // 로그아웃 확인 알림창 상태
  const [alertVisible, setAlertVisible] = useState(false);

  /**
   * @description 로그아웃 버튼을 눌렀을 때 확인창을 띄웁니다.
   */
  const handleLogoutPress = () => {
    setAlertVisible(true);
  };

  /**
   * @description 로그아웃을 최종 승인했을 때 실행됩니다.
   */
  const confirmLogout = () => {
    setAlertVisible(false);
    onClose(); // 모달을 닫고
    onLogout(); // 상위 컴포넌트(Dashboard)의 로그아웃 로직을 실행합니다.
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 배경 오버레이 (클릭 시 닫힘) */}
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        {/* 모달 실제 콘텐츠 영역 */}
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
          
          {/* 헤더 섹션: 제목 및 닫기 버튼 */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>설정</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 계정 정보 섹션: 로그인된 사용자의 이메일을 보여줍니다. */}
          <View style={styles.section}>
            <Text style={styles.label}>계정 정보</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>아이디(이메일)</Text>
              <Text style={styles.infoValue}>{user?.email || '정보 없음'}</Text>
            </View>
          </View>

          {/* 하단 실행 섹션: 로그아웃 및 앱 버전 표시 */}
          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogoutPress}
            >
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>앱 버전 1.0.0</Text>
          </View>

          {/* 로그아웃 최종 확인용 알림창 */}
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
    height: height * 0.45,
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
  bottomSection: {
    marginTop: 'auto',
    marginBottom: 40,
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
