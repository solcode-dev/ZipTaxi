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
