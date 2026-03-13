import { useQuery } from '@tanstack/react-query';
import { firebaseDb, firebaseAuth } from '../lib/firebase';

/**
 * 특정 연도의 월별 수입 합계를 반환합니다.
 * revenues 컬렉션을 연도 단위로 1회 쿼리 후 월별로 집계합니다.
 * React Query를 통해 연도별 캐싱을 활용하여 빠른 화면 전환을 제공합니다.
 */
export function useYearlyRevenue(year: number) {
  const query = useQuery({
    queryKey: ['yearlyRevenue', year],
    queryFn: async () => {
      const uid = firebaseAuth.currentUser?.uid;
      if (!uid) return Array(12).fill(0) as number[];

      const snap = await firebaseDb
        .collection('users').doc(uid)
        .collection('revenues')
        .where('dateStr', '>=', `${year}-01-01`)
        .where('dateStr', '<=', `${year}-12-31`)
        .get();

      const totals = Array(12).fill(0) as number[];
      snap.docs.forEach(doc => {
        const data = doc.data();
        const dateStr = data.dateStr as string | undefined;
        const amount = (data.amount as number) ?? 0;
        
        if (dateStr) {
          const month = parseInt(dateStr.split('-')[1], 10) - 1; // 0-indexed
          totals[month] += amount;
        }
      });
      return totals;
    },
    // 최신화 주기를 5분(강제 새로고침 방지, 화면전환 최적화)으로 설정
    staleTime: 5 * 60 * 1000, 
  });

  // fallback empty array when no data
  const monthly = query.data ?? Array(12).fill(0);
  
  return { monthly, loading: query.isLoading };
}
