import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SectionList,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';

import { firebaseAuth, firebaseDb } from '../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

import { useRevenueTracker } from '../hooks/useRevenueTracker';
import { CustomAlert } from './CustomAlert';
import { formatCurrency } from '../utils/formatUtils';
import { formatMonthTitle, getDayLabel } from '../utils/dateUtils';
import type { RevenueRecord, RevenueSource } from '../types/models';

// ─── 타입 ────────────────────────────────────────────────────────────────────

type FilterKey = 'all' | RevenueSource;

interface SectionData {
  title: string;
  data: RevenueRecord[];
  dayTotal: number;
  dateKey: string;
}

interface RevenueHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

// ─── 상수 ────────────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<RevenueSource, { label: string; badgeColor: string; textColor: string }> = {
  kakao: { label: '카카오T',  badgeColor: '#FFE812', textColor: '#3C1E1E' },
  card:  { label: '카드',     badgeColor: '#E3F2FD', textColor: '#1565C0' },
  cash:  { label: '현금',     badgeColor: '#E8F5E9', textColor: '#2E7D32' },
  other: { label: '기타',     badgeColor: '#F5F5F5', textColor: '#666'    },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',   label: '전체'   },
  { key: 'kakao', label: '카카오T' },
  { key: 'card',  label: '카드'   },
  { key: 'cash',  label: '현금'   },
  { key: 'other', label: '기타'   },
];

// ─── 순수 함수 ────────────────────────────────────────────────────────────────

function buildSections(docs: RevenueRecord[]): SectionData[] {
  const sorted = [...docs].sort(
    (a, b) => (b.timestamp?.toMillis() ?? 0) - (a.timestamp?.toMillis() ?? 0),
  );

  const groups = sorted.reduce<Record<string, RevenueRecord[]>>((acc, item) => {
    (acc[item.dateStr] ??= []).push(item);
    return acc;
  }, {});

  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .map(dateKey => {
      const items = groups[dateKey];
      return {
        title: getDayLabel(dateKey),
        dateKey,
        data: items,
        dayTotal: items.reduce((sum, item) => sum + item.amount, 0),
      };
    });
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export const RevenueHistoryModal = ({ visible, onClose }: RevenueHistoryModalProps) => {
  const { deleteRevenue } = useRevenueTracker();

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [rawDocs, setRawDocs]           = useState<RevenueRecord[]>([]);
  const [loading, setLoading]           = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const [alertVisible, setAlertVisible]         = useState(false);
  const [selectedRevenue, setSelectedRevenue]   = useState<RevenueRecord | null>(null);
  const [alertType, setAlertType]               = useState<'confirm_delete' | 'error'>('confirm_delete');

  // ── 파생 데이터 ──────────────────────────────────────────────────────────────

  const monthlyTotal = useMemo(
    () => rawDocs.reduce((sum, d) => sum + d.amount, 0),
    [rawDocs],
  );

  const filteredDocs = useMemo(
    () => activeFilter === 'all' ? rawDocs : rawDocs.filter(d => d.source === activeFilter),
    [rawDocs, activeFilter],
  );

  const sections = useMemo(() => buildSections(filteredDocs), [filteredDocs]);

  const filteredTotal = useMemo(
    () => filteredDocs.reduce((sum, d) => sum + d.amount, 0),
    [filteredDocs],
  );

  // ── Firestore 구독 ────────────────────────────────────────────────────────────

  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user || !visible) return;

    setLoading(true);

    const year    = currentMonth.getFullYear();
    const month   = currentMonth.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const pad     = (n: number) => String(n).padStart(2, '0');
    const startStr = `${year}-${pad(month)}-01`;
    const endStr   = `${year}-${pad(month)}-${lastDay}`;

    const revenueRef = collection(firebaseDb, 'users', user.uid, 'revenues');
    const q = query(
      revenueRef,
      where('dateStr', '>=', startStr),
      where('dateStr', '<=', endStr),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
        })) as RevenueRecord[];
        setRawDocs(docs);
        setLoading(false);
      },
      (error) => {
        console.error('수익 내역 조회 에러:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [visible, currentMonth]);

  // ── 월 이동 ───────────────────────────────────────────────────────────────────

  const goToPrevMonth = () => {
    setActiveFilter('all');
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setActiveFilter('all');
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  // ── 삭제 ──────────────────────────────────────────────────────────────────────

  const handleDeletePress = (item: RevenueRecord) => {
    setSelectedRevenue(item);
    setAlertType('confirm_delete');
    setAlertVisible(true);
  };

  const handleConfirmAction = async () => {
    if (alertType === 'confirm_delete' && selectedRevenue) {
      const success = await deleteRevenue(
        selectedRevenue.id,
        selectedRevenue.amount,
        selectedRevenue.dateStr,
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

  // ── 렌더링 ────────────────────────────────────────────────────────────────────

  const renderSectionHeader = ({ section: { title, dayTotal } }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionTotal}>{formatCurrency(dayTotal)}원</Text>
    </View>
  );

  const renderItem = ({ item }: { item: RevenueRecord }) => {
    const timeStr = item.timestamp?.toDate().toLocaleTimeString('ko-KR', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
    const { label, badgeColor, textColor } = SOURCE_CONFIG[item.source] ?? SOURCE_CONFIG.other;

    return (
      <View style={styles.recordRow}>
        <View style={styles.rowLeft}>
          <Text style={styles.timeText}>{timeStr}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
          </View>
        </View>

        <View style={styles.rowRight}>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}원</Text>
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

  const alertProps = alertType === 'confirm_delete' && selectedRevenue
    ? {
        title: '내역 삭제',
        message: `${formatCurrency(selectedRevenue.amount)}원 내역을 삭제하시겠습니까?`,
        confirmText: '삭제',
        showCancel: true,
        onConfirm: handleConfirmAction,
      }
    : {
        title: '오류',
        message: '내역을 삭제하지 못했습니다. 다시 시도해 주세요.',
        confirmText: '확인',
        showCancel: false,
        onConfirm: handleAlertClose,
      };

  const summaryLabel = activeFilter === 'all'
    ? '이번 달 총 수입'
    : `${FILTERS.find(f => f.key === activeFilter)?.label} 수입`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>운행 상세 내역</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>

        {/* 월 네비게이션 */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
            <Text style={styles.navBtnText}>〈</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatMonthTitle(currentMonth)}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
            <Text style={styles.navBtnText}>〉</Text>
          </TouchableOpacity>
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{summaryLabel}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(filteredTotal)}원</Text>
          {activeFilter !== 'all' && (
            <Text style={styles.summarySubLabel}>이달 전체: {formatCurrency(monthlyTotal)}원</Text>
          )}
        </View>

        {/* 필터 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {FILTERS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterTab, activeFilter === key && styles.filterTabActive]}
              onPress={() => setActiveFilter(key)}
            >
              <Text style={[styles.filterTabText, activeFilter === key && styles.filterTabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 내역 리스트 */}
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
              keyExtractor={item => item.id}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled
            />
          )}
        </View>

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

// ─── 스타일 ───────────────────────────────────────────────────────────────────

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
    padding: 20,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  summarySubLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  filterBar: {
    flexGrow: 0,
    paddingVertical: 10,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  filterTabTextActive: {
    color: '#FFF',
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
  },
});
