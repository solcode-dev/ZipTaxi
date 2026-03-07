/** 수입원(결제 수단) 타입 */
export type RevenueSource = 'kakao' | 'card' | 'cash' | 'other';

/** Firestore 수입 기록 문서 (users/{uid}/revenues/{id}) */
export interface RevenueRecord {
  id: string;
  amount: number;
  source: RevenueSource;
  dateStr: string; // YYYY-MM-DD
  timestamp: { toDate(): Date; toMillis(): number };
  note?: string;
}

/** Firestore 사용자 문서 (users/{uid}) */
export interface UserDocument {
  name: string;
  username: string;
  email: string;
  role: 'driver';
  createdAt: any;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  monthlyGoal: number;
  lastRevenueDate?: string;
  currentStreak: number;
  maxStreak: number;
  freezeCount: number;
  lastGoalDate?: string;
}

/** 대시보드 통계 (계산 결과) */
export interface DashboardStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  monthlyGoal: number;
  remaining: number;
  progress: number;
  daysLeft: number;
}
