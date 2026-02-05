import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SectionList } from 'react-native';
import { theme } from '../theme';

// 중앙 집중식 Firebase 서비스 레이어 및 모듈형 SDK 기능을 가져옵니다.
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp, 
  FirebaseFirestoreTypes 
} from '@react-native-firebase/firestore';

import { useRevenueTracker } from '../hooks/useRevenueTracker';
import { CustomAlert } from './CustomAlert';

/**
 * [수익 내역 데이터 인터페이스]
 */
interface RevenueRecord {
  id: string;
  amount: number;
  source: 'kakao' | 'card' | 'cash' | 'other';
  dateStr: string; // YYYY-MM-DD
  timestamp: Timestamp;
}

interface RevenueHistoryModalProps {
  visible: boolean; // 모달 표시 여부
  onClose: () => void; // 모달 닫기 콜백
}

/**
 * [섹션 리스트 데이터 구조 인터페이스]
 * 날짜별로 수익 내역을 그룹화하여 보여주기 위한 구조입니다.
 */
interface SectionData {
  title: string; // 화면에 표시될 날짜 (예: "1월 20일 (토)")
  data: RevenueRecord[]; // 해당 날짜의 수익 목록
  dayTotal: number; // 해당 날짜의 총 수익 합계
  dateKey: string; // 그룹화 기준이 되는 날짜 문자열 (YYYY-MM-DD)
}

// 요일 표시용 배열
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * [운행 상세 내역 모달 컴포넌트]
 * 월별로 운행 수익 내역을 확인하고, 필요 시 내역을 삭제할 수 있습니다.
 */
export const RevenueHistoryModal = ({ visible, onClose }: RevenueHistoryModalProps) => {
  const { deleteRevenue } = useRevenueTracker();
  
  // 1. 월 선택 상태 (초기값: 현재 달)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // 2. 데이터 상태 (섹션 리스트용)
  const [sections, setSections] = useState<SectionData[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0); // 이번 달 전체 수익 합계
  const [loading, setLoading] = useState(false);

  // 3. 내역 삭제 관련 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueRecord | null>(null);
  const [alertType, setAlertType] = useState<'confirm_delete' | 'error'>('confirm_delete');

  // --- 유틸리티 함수 ---
  
  /**
   * @description 현재 선택된 월의 제목을 생성합니다 (예: "2024년 1월")
   */
  const formatMonthTitle = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  /**
   * @description 날짜 문자열로부터 요일 포함 라벨을 만듭니다 (예: "1월 20일 (토)")
   */
  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
  };

  // 이전 달로 이동
  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  /**
   * [실시간 수익 데이터 구독]
   * 선택된 월의 시작일부터 말일까지의 데이터를 Firestore에서 실시간으로 가져옵니다.
   */
  useEffect(() => {
    /**
     * [데이터 가공 로직]
     * 1. 시간순(최신순) 정렬 / 2. 총 합계 계산 / 3. 날짜별 그룹화 및 섹션 데이터 생성
     */
    const processData = (docs: RevenueRecord[]) => {
      // 1. 역순 정렬 (최신 시간이 상단으로)
      docs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

      // 2. 월간 총합 계산
      const total = docs.reduce((sum, item) => sum + item.amount, 0);
      setMonthlyTotal(total);

      // 3. 날짜별 그룹화
      const groups: Record<string, RevenueRecord[]> = {};
      docs.forEach(item => {
          if (!groups[item.dateStr]) {
              groups[item.dateStr] = [];
          }
          groups[item.dateStr].push(item);
      });

      // 4. 날짜 문자열 역순 정렬 (최신 날짜가 상단으로)
      const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

      // 5. SectionList용 구조로 변환
      const processedSections: SectionData[] = sortedKeys.map(dateKey => {
          const dayItems = groups[dateKey];
          const dayTotal = dayItems.reduce((sum, item) => sum + item.amount, 0);
          
          return {
              title: getDayLabel(dateKey),
              dateKey: dateKey,
              data: dayItems,
              dayTotal: dayTotal,
          };
      });

      setSections(processedSections);
    };

    const user = firebaseAuth.currentUser;
    if (!user || !visible) return;
    
    setLoading(true);

    // 해당 월의 범위를 계산합니다 (01일 ~ 마지막일)
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Firestore 쿼리 생성
    const revenueRef = collection(firebaseDb, 'users', user.uid, 'revenues');
    const q = query(
      revenueRef,
      where('dateStr', '>=', startStr),
      where('dateStr', '<=', endStr)
    );

    // 실시간 리스너 연결
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot) {
            setLoading(false);
            return;
        }
        
        const docs = snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
        })) as RevenueRecord[];
        
        processData(docs);
        setLoading(false);
      },
      (error) => {
          console.error("수익 내역 조회 에러:", error);
          setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [visible, currentMonth]);

  /**
   * [내역 삭제 처리]
   * 삭제 버튼 클릭 시 확인 알림창을 띄우고, 승인 시 DB에서 삭제합니다.
   */
  const handleDeletePress = (item: RevenueRecord) => {
    setSelectedRevenue(item);
    setAlertType('confirm_delete');
    setAlertVisible(true);
  };

  const handleConfirmAction = async () => {
    if (alertType === 'confirm_delete' && selectedRevenue) {
      // useRevenueTracker 훅을 통해 DB 삭제 및 합계 금액 차감 처리
      const success = await deleteRevenue(
        selectedRevenue.id, 
        selectedRevenue.amount, 
        selectedRevenue.dateStr
      );
      
      if (success) {
        setAlertVisible(false);
        setSelectedRevenue(null);
      } else {
        setAlertType('error');
      }
    } else {
      setAlertVisible(false);
    }
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    setTimeout(() => {
        setSelectedRevenue(null);
        setAlertType('confirm_delete');
    }, 300);
  };

  // --- 렌더링 함수들 ---

  /**
   * @description 섹션 헤더 (날짜 및 일일 합계 표시)
   */
  const renderSectionHeader = ({ section: { title, dayTotal } }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionTotal}>{dayTotal.toLocaleString()}원</Text>
    </View>
  );

  /**
   * @description 개별 수익 내역 항목 (시간, 결제수단, 금액 표시)
   */
  const renderItem = ({ item }: { item: RevenueRecord }) => {
    // 입력 시간 포맷팅 (예: 오전 10:30)
    const timeStr = item.timestamp?.toDate().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
    
    // 결제수단별 배지 스타일 및 텍스트 설정
    let sourceLabel = '기타';
    let sourceColor = '#F5F5F5';
    let labelColor = '#666';

    if (item.source === 'kakao') {
      sourceLabel = '카카오T';
      sourceColor = '#FFE812';
      labelColor = '#3C1E1E';
    } else if (item.source === 'card') {
      sourceLabel = '카드/현금';
      sourceColor = '#E3F2FD';
      labelColor = '#1565C0';
    } else if (item.source === 'cash') {
      sourceLabel = '현금';
      sourceColor = '#E8F5E9';
      labelColor = '#2E7D32'; 
    }

    return (
      <View style={styles.recordRow}>
        <View style={styles.rowLeft}>
            <Text style={styles.timeText}>{timeStr}</Text>
            <View style={[styles.badge, { backgroundColor: sourceColor }]}>
                <Text style={[styles.badgeText, { color: labelColor }]}>{sourceLabel}</Text>
            </View>
        </View>
        
        <View style={styles.rowRight}>
          <Text style={styles.amountText}>{item.amount.toLocaleString()}원</Text>
          <TouchableOpacity 
            onPress={() => handleDeletePress(item)} 
            style={styles.deleteButton} 
            hitSlop={styles.hitSlop}
          >
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 쾌적한 팝업창을 위한 설정 로직
  const getAlertProps = () => {
    if (alertType === 'confirm_delete' && selectedRevenue) {
        return {
            title: "내역 삭제",
            message: `${selectedRevenue.amount.toLocaleString()}원 내역을 삭제하시겠습니까?`,
            confirmText: "삭제",
            showCancel: true,
            onConfirm: handleConfirmAction
        };
    }
    return {
        title: "오류",
        message: "내역을 삭제하지 못했습니다. 다시 시도해 주세요.",
        confirmText: "확인",
        showCancel: false,
        onConfirm: handleAlertClose
    };
  };

  const alertProps = getAlertProps();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 모달 상단 헤더: 제목 및 닫기 버튼 */}
        <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>운행 상세 내역</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
        </View>

        {/* 1. 월 이동 네비게이션 */}
        <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Text style={styles.navBtnText}>〈</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formatMonthTitle(currentMonth)}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Text style={styles.navBtnText}>〉</Text>
            </TouchableOpacity>
        </View>

        {/* 2. 해당 월의 총 수익 요약 카드 */}
        <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>이번 달 총 수입</Text>
                <Text style={styles.summaryValue}>{monthlyTotal.toLocaleString()}원</Text>
            </View>
        </View>

        {/* 3. 일별로 그룹화된 상세 내역 리스트 */}
        <View style={styles.content}>
            {sections.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                        {loading ? '데이터를 불러오는 중...' : '해당 기간의 운행 기록이 없습니다.'}
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={true}
                />
            )}
        </View>

        {/* 내역 삭제 확인용 알림창 */}
        <CustomAlert 
          visible={alertVisible}
          title={alertProps.title}
          message={alertProps.message}
          confirmText={alertProps.confirmText}
          onConfirm={alertProps.onConfirm}
          onCancel={alertProps.showCancel ? handleAlertClose : undefined}
          onClose={handleAlertClose}
        />
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
      position: 'relative',
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  monthNav: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: '#FFF',
  },
  navBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
  },
  navBtnText: {
      fontSize: 20,
      color: '#999',
      fontWeight: 'bold',
  },
  monthTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      minWidth: 120,
      textAlign: 'center',
  },
  summaryCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 10,
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
      fontWeight: '600',
  },
  summaryValue: {
      color: '#FFF',
      fontSize: 24,
      fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#F5F7FA',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#666',
  },
  sectionTotal: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
  },
  recordRow: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  timeText: {
      fontSize: 14,
      color: '#888',
      width: 65,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12, 
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 14,
    color: '#CCC',
  },
  emptyState: {
      marginTop: 60,
      alignItems: 'center',
  },
  emptyText: {
      fontSize: 15,
      color: '#999',
  },
  listContainer: {
    paddingBottom: 60,
  },
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  }
});
