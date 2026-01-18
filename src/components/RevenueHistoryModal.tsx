import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SectionList, Alert } from 'react-native';
import { theme } from '../theme';
import auth from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, Timestamp, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useRevenueTracker } from '../hooks/useRevenueTracker';
import { CustomAlert } from './CustomAlert';

interface RevenueRecord {
  id: string;
  amount: number;
  source: 'kakao' | 'card' | 'cash' | 'other';
  dateStr: string;
  timestamp: Timestamp;
}

interface RevenueHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SectionData {
  title: string; // "2024-01-18 (토)"
  data: RevenueRecord[];
  dayTotal: number;
  dateKey: string; // "2024-01-18"
}

// Helper Keys
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const RevenueHistoryModal = ({ visible, onClose }: RevenueHistoryModalProps) => {
  const { deleteRevenue } = useRevenueTracker();
  const user = auth().currentUser;

  // 1. Month State: Defaults to current date (First day of month technically not needed for Date obj but good for logic)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // 2. Data State
  const [sections, setSections] = useState<SectionData[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Alert & Selection State
  const [alertVisible, setAlertVisible] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueRecord | null>(null);
  const [alertType, setAlertType] = useState<'confirm_delete' | 'error'>('confirm_delete');

  // --- Helpers ---
  const formatMonthTitle = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const getDayLabel = (dateStr: string) => {
    // dateStr: YYYY-MM-DD
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    const now = new Date();
    // Prevent future (optional, but good for now)
    // if (newDate.getMonth() === now.getMonth() && newDate.getFullYear() === now.getFullYear()) return;
    
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  // --- Query Logic ---
  useEffect(() => {
    if (!user || !visible) return;
    setLoading(true);

    const db = getFirestore();
    
    // Calculate Start/End of Month Strings
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const itemsPerMonth = new Date(year, month, 0).getDate(); // Last day of month
    
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month).padStart(2, '0')}-${itemsPerMonth}`;

    console.log(`Fetching History: ${startStr} ~ ${endStr}`);

    const q = query(
      collection(db, 'users', user.uid, 'revenues'),
      where('dateStr', '>=', startStr),
      where('dateStr', '<=', endStr)
    );

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
          console.error("Revenue History Query Error:", error);
        //   Alert.alert("오류", "데이터를 불러오는 중 문제가 발생했습니다.");
          setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, visible, currentMonth]);

  // --- Data Processing (Grouping) ---
  const processData = (docs: RevenueRecord[]) => {
    // 1. Sort by timestamp desc
    docs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

    // 2. Calculate Monthly Total
    const total = docs.reduce((sum, item) => sum + item.amount, 0);
    setMonthlyTotal(total);

    // 3. Group by Date
    const groups: Record<string, RevenueRecord[]> = {};
    docs.forEach(item => {
        if (!groups[item.dateStr]) {
            groups[item.dateStr] = [];
        }
        groups[item.dateStr].push(item);
    });

    // 4. Convert to SectionList Data
    // Object.keys is not guaranteed order, but we sorted docs so dates usually appear in order? NO.
    // We need to sort keys (dates) descending.
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // Desc '2024-01-31' > '2024-01-01'

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

  // --- Interaction Handlers ---
  const handleDeletePress = (item: RevenueRecord) => {
    setSelectedRevenue(item);
    setAlertType('confirm_delete');
    setAlertVisible(true);
  };

  const handleConfirm = async () => {
    if (alertType === 'confirm_delete' && selectedRevenue) {
      const deletedId = selectedRevenue.id; 
      // Note: We don't perform optimistic UI here because SectionList + Snapshot is complex.
      // We rely on Snapshot's fast update.
      
      const success = await deleteRevenue(selectedRevenue.id, selectedRevenue.amount, selectedRevenue.dateStr);
      
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

  // --- Renderers ---
  const renderSectionHeader = ({ section: { title, dayTotal } }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionTotal}>{dayTotal.toLocaleString()}원</Text>
    </View>
  );

  const renderItem = ({ item }: { item: RevenueRecord }) => {
    const timeStr = item.timestamp?.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    
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
            {/* Time */}
            <Text style={styles.timeText}>{timeStr}</Text>
            
            {/* Source Badge */}
            <View style={[styles.badge, { backgroundColor: sourceColor }]}>
                <Text style={[styles.badgeText, { color: labelColor }]}>{sourceLabel}</Text>
            </View>
        </View>
        
        <View style={styles.rowRight}>
          <Text style={styles.amountText}>{item.amount.toLocaleString()}원</Text>
          <TouchableOpacity onPress={() => handleDeletePress(item)} style={styles.deleteButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Dynamic Alert Content
  const getAlertContent = () => {
    if (alertType === 'confirm_delete' && selectedRevenue) {
        return {
            title: "내역 삭제",
            message: `${selectedRevenue.amount.toLocaleString()}원을 삭제하시겠습니까?`,
            confirmText: "삭제",
            showCancel: true,
            onConfirm: handleConfirm
        };
    } else {
        return {
            title: "오류",
            message: "삭제에 실패했습니다. 다시 시도해주세요.",
            confirmText: "확인",
            showCancel: false,
            onConfirm: handleAlertClose
        };
    }
  };

  const alertContent = getAlertContent();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Helper Bar: Close and Title */}
        <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>운행 상세 내역</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
        </View>

        {/* 1. Month Navigation */}
        <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Text style={styles.navBtnText}>〈</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formatMonthTitle(currentMonth)}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Text style={styles.navBtnText}>〉</Text>
            </TouchableOpacity>
        </View>

        {/* 2. Monthly Summary Card */}
        <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>총 수입</Text>
                <Text style={styles.summaryValue}>{monthlyTotal.toLocaleString()}원</Text>
            </View>
            {/* Could add 'Count' here if we flatten sections */}
        </View>

        {/* 3. Grouped Content */}
        <View style={styles.content}>
            {sections.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                        {loading ? '불러오는 중...' : '기록된 운행 내역이 없습니다.'}
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={{ paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={true}
                />
            )}
        </View>

        <CustomAlert 
          visible={alertVisible}
          title={alertContent.title}
          message={alertContent.message}
          confirmText={alertContent.confirmText}
          onConfirm={alertContent.onConfirm}
          onCancel={alertContent.showCancel ? handleAlertClose : undefined}
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
      justifyContent: 'center', // Center title
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
  // Month Nav
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
  // Summary
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
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#F5F7FA', // Match bg to seem transparent or sticky header style
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
      width: 65, // Fixed width for alignment
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
  }
});
