import { useState, useEffect, useMemo } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from '@react-native-firebase/firestore';
import { theme } from '../theme';
import { toDateStr, getMondayOfWeek } from '../utils/dateUtils';

/**
 * [주간 수입/지출 데이터 조회 훅]
 * 이번 주(월요일 ~ 일요일)의 일별 수입·지출 합계를 실시간으로 집계하여
 * 차트 라이브러리(react-native-gifted-charts) 형식에 맞게 반환합니다.
 */
export const useWeeklyRevenue = () => {
    const [dailyRevenue, setDailyRevenue] = useState<Record<string, number>>({});
    const [dailyExpense, setDailyExpense] = useState<Record<string, number>>({});
    const [revenueFired, setRevenueFired] = useState(false);
    const [expenseFired, setExpenseFired] = useState(false);
    const [maxVal, setMaxVal] = useState(100000);

    // 이번 주 월요일 — 세션 동안 안정적으로 유지
    const monday = useMemo(() => getMondayOfWeek(), []);
    const startStr = useMemo(() => toDateStr(monday), [monday]);
    const endStr = useMemo(() => {
        const sun = new Date(monday);
        sun.setDate(monday.getDate() + 6);
        return toDateStr(sun);
    }, [monday]);

    useEffect(() => {
        const user = firebaseAuth.currentUser;
        if (!user) {
            setRevenueFired(true);
            setExpenseFired(true);
            return;
        }

        const revenueQuery = query(
            collection(firebaseDb, 'users', user.uid, 'revenues'),
            where('dateStr', '>=', startStr),
            where('dateStr', '<=', endStr)
        );

        const expenseQuery = query(
            collection(firebaseDb, 'users', user.uid, 'expenses'),
            where('dateStr', '>=', startStr),
            where('dateStr', '<=', endStr)
        );

        const revenueUnsub = onSnapshot(revenueQuery, (snapshot) => {
            const map: Record<string, number> = {};
            snapshot.docs.forEach((doc: any) => {
                const d = doc.data();
                map[d.dateStr] = (map[d.dateStr] || 0) + (d.amount || 0);
            });
            setDailyRevenue(map);
            setRevenueFired(true);
        }, (error) => {
            console.error('주간 수입 차트 로드 에러:', error);
            setRevenueFired(true);
        });

        const expenseUnsub = onSnapshot(expenseQuery, (snapshot) => {
            const map: Record<string, number> = {};
            snapshot.docs.forEach((doc: any) => {
                const d = doc.data();
                map[d.dateStr] = (map[d.dateStr] || 0) + (d.amount || 0);
            });
            setDailyExpense(map);
            setExpenseFired(true);
        }, (error) => {
            console.error('주간 지출 차트 로드 에러:', error);
            setExpenseFired(true);
        });

        return () => {
            revenueUnsub();
            expenseUnsub();
        };
    }, [startStr, endStr]);

    const loading = !revenueFired || !expenseFired;

    const chartData = useMemo(() => {
        const labels = ['월', '화', '수', '목', '금', '토', '일'];
        const formatted: any[] = [];
        let currentMax = 50000;

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dStr = toDateStr(date);
            const revenue = dailyRevenue[dStr] || 0;
            const expense = dailyExpense[dStr] || 0;

            formatted.push({
                value: revenue,
                label: labels[i],
                frontColor: theme.colors.primary,
                spacing: 2,
                labelTextStyle: { color: '#666' },
            });
            formatted.push({
                value: expense,
                frontColor: '#FF6B6B',
            });

            if (revenue > currentMax) currentMax = revenue;
            if (expense > currentMax) currentMax = expense;
        }

        setMaxVal(Math.ceil(currentMax / 50000) * 50000 + 50000);
        return formatted;
    }, [dailyRevenue, dailyExpense, monday]);

    return { chartData, loading, maxVal };
};
