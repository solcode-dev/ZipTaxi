import { useState, useEffect } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';

/**
 * 특정 연도의 월별 수입 합계를 반환합니다.
 * revenues 컬렉션을 연도 단위로 1회 쿼리 후 월별로 집계합니다.
 */
export function useYearlyRevenue(year: number) {
  const [monthly, setMonthly] = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    let cancelled = false;
    setLoading(true);

    firebaseDb
      .collection('users').doc(uid)
      .collection('revenues')
      .where('dateStr', '>=', `${year}-01-01`)
      .where('dateStr', '<=', `${year}-12-31`)
      .get()
      .then(snap => {
        if (cancelled) return;
        const totals = Array(12).fill(0) as number[];
        snap.docs.forEach(doc => {
          const dateStr  = doc.data().dateStr as string | undefined;
          const amount   = (doc.data().amount  as number) ?? 0;
          if (dateStr) {
            const month = parseInt(dateStr.split('-')[1], 10) - 1; // 0-indexed
            totals[month] += amount;
          }
        });
        setMonthly(totals);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [year]);

  return { monthly, loading };
}
