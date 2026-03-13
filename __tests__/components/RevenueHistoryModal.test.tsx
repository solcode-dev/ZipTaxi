import React from 'react';
import { Text, TouchableOpacity, SectionList } from 'react-native';
import renderer from 'react-test-renderer';
import { RevenueHistoryModal } from '../../src/components/RevenueHistoryModal';
import { useRevenueTracker } from '../../src/hooks/useRevenueTracker';
import { createComponent } from '../helpers/renderHook';
import { onSnapshot } from '@react-native-firebase/firestore';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../src/lib/firebase', () => ({
  firebaseAuth: { currentUser: { uid: 'test-uid' } },
  firebaseDb: {},
}));

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('../../src/hooks/useRevenueTracker', () => ({
  useRevenueTracker: jest.fn(),
}));

// Firestore Timestamp 목업
const mockTimestamp = (millis: number) => ({
  toMillis: () => millis,
  toDate: () => new Date(millis),
});

const mockDocs = [
  {
    id: 'rev1',
    amount: 15000,
    source: 'kakao',
    dateStr: '2026-03-12',
    timestamp: mockTimestamp(new Date('2026-03-12T10:00:00Z').getTime()),
  },
  {
    id: 'rev2',
    amount: 5000,
    source: 'card',
    dateStr: '2026-03-12',
    timestamp: mockTimestamp(new Date('2026-03-12T14:00:00Z').getTime()),
  },
  {
    id: 'rev3',
    amount: 10000,
    source: 'cash',
    dateStr: '2026-03-11',
    timestamp: mockTimestamp(new Date('2026-03-11T09:00:00Z').getTime()),
  },
];

describe('RevenueHistoryModal', () => {
  const mockDeleteRevenue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRevenueTracker as jest.Mock).mockReturnValue({
      deleteRevenue: mockDeleteRevenue,
    });
  });

  it('visible이 false이면 모달 내역을 렌더링하지 않음(onSnapshot 호출도 안함)', () => {
    // modal 자체는 RN Modal이지만, visible=false면 내부 로직 onSnapshot이 돌지 않음.
    createComponent(<RevenueHistoryModal visible={false} onClose={jest.fn()} />);
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('visible이 true일 때 onSnapshot을 통해 데이터를 로드하고 렌더링한다', () => {
    // onSnapshot 모의 구현
    (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
      // 컴포넌트에 즉시 데이터 주입
      callback({
        docs: mockDocs.map(d => ({
          id: d.id,
          data: () => d,
        })),
      });
      return jest.fn(); // unsubscribe
    });

    const tree = createComponent(<RevenueHistoryModal visible={true} onClose={jest.fn()} />);
    
    expect(onSnapshot).toHaveBeenCalled();

    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    const joinedTexts = texts.flat(Infinity).join('');

    // 날짜 그룹(섹션)과 데이터가 있는지 확인
    expect(joinedTexts).toContain('3월 12일');
    expect(joinedTexts).toContain('3월 11일');
    
    // 금액 확인
    expect(joinedTexts).toContain('15,000원');
    expect(joinedTexts).toContain('5,000원');
    expect(joinedTexts).toContain('10,000원');
    
    // 이달 전체 (15000+5000+10000) = 30000
    expect(joinedTexts).toContain('30,000원');
  });

  it('필터 탭 클릭 시 해당 데이터만 보여준다', () => {
    (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
      callback({
        docs: mockDocs.map(d => ({ id: d.id, data: () => d })),
      });
      return jest.fn();
    });

    const tree = createComponent(<RevenueHistoryModal visible={true} onClose={jest.fn()} />);
    
    // "카카오T" 필터 버튼 찾기
    const filterButtons = tree.root.findAllByType(TouchableOpacity).filter(btn => {
      const texts = btn.findAllByType(Text);
      return texts.length > 0 && texts[0].props.children === '카카오T';
    });
    
    expect(filterButtons.length).toBeGreaterThan(0);
    
    // 탭 클릭
    renderer.act(() => {
      filterButtons[0].props.onPress();
    });

    const sectionLists = tree.root.findAllByType(SectionList);
    expect(sectionLists.length).toBe(1);
    
    const listSections = sectionLists[0].props.sections;
    
    // 카카오T 데이터만 남았는지 검증
    let totalItems = 0;
    listSections.forEach((sec: any) => {
      totalItems += sec.data.length;
    });
    
    expect(totalItems).toBe(1);
    expect(listSections[0].data[0].amount).toBe(15000); // 카카오T 데이터
  });

  it('x 버튼을 누르면 삭제 확인 알림창이 나타난다', () => {
    (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
      callback({
        docs: mockDocs.map(d => ({ id: d.id, data: () => d })),
      });
      return jest.fn();
    });

    const tree = createComponent(<RevenueHistoryModal visible={true} onClose={jest.fn()} />);
    
    // 삭제 버튼들 
    const deleteButtons = tree.root.findAllByType(TouchableOpacity).filter(btn => {
      const texts = btn.findAllByType(Text);
      return texts.length > 0 && texts[0].props.children === '✕';
    });
    
    expect(deleteButtons.length).toBe(3);

    // 첫 번째 삭제 버튼 클릭 (15000원짜리)
    renderer.act(() => {
      deleteButtons[0].props.onPress();
    });

    // CustomAlert의 삭제 확인 로직 검증 (title="내역 삭제")
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    // Alert 모달 내부 Message 검사
    expect(texts.flat(Infinity).join('')).toContain('5,000원 내역을 삭제하시겠습니까?');
  });
});
