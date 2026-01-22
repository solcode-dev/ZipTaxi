# firebase firestore에 저장되거나 앱 내부에서 주고받을 데이터 구조를 정의

export interface User {
   uid: string;
   email: string;
   createAt: Date;
   displayName?: string;
}

export interface Revenue {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'kakao' | 'uber';
  timestamp: Date;
  note?: string;
  createdAt: Date;
}

export interface MonthlyGoal {
  id: string;
  userId: string;
  year: number;
  month: number;
  targetAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  monthlyGoal: number;
  remaining: number;
  progress: number;
  daysLeft: number;
}
