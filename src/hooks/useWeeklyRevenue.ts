import { useState, useEffect, useMemo } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from '@react-native-firebase/firestore';
import { theme } from '../theme';
import { toDateStr, getMondayOfWeek } from '../utils/dateUtils';

const LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function buildDailyMap(docs: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    docs.forEach((doc) => {
        const d = doc.data();
        map[d.dateStr] = (map[d.dateStr] || 0) + (d.amount || 0);
    });
    return map;
}

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

    const monday = useMemo(() => getMondayOfWeek(), []);
    const startStr = useMemo(() => toDateStr(monday), [monday]);
    const endStr = useMemo(() => {
        const sun = new Date(monday);
        sun.setDate(monday.getDate() + 6);
        return toDateStr(sun);
    }, [monday]);

    useEffect(() => {
        // 주가 바뀌어 effect가 재실행되면 loading 상태로 되돌림
        setRevenueFired(false);
        setExpenseFired(false);

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

        const revenueUnsub = onSnapshot(
            revenueQuery,
            (snapshot) => {
                setDailyRevenue(buildDailyMap(snapshot.docs));
                setRevenueFired(true);
            },
            (error) => {
                console.error('주간 수입 차트 로드 에러:', error);
                setRevenueFired(true);
            }
        );

        const expenseUnsub = onSnapshot(
            expenseQuery,
            (snapshot) => {
                setDailyExpense(buildDailyMap(snapshot.docs));
                setExpenseFired(true);
            },
            (error) => {
                console.error('주간 지출 차트 로드 에러:', error);
                setExpenseFired(true);
            }
        );

        return () => {
            revenueUnsub();
            expenseUnsub();
        };
    }, [startStr, endStr]);

    const loading = !revenueFired || !expenseFired;

    const chartData = useMemo(() => {
        const formatted: any[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dStr = toDateStr(date);

            formatted.push({
                value: dailyRevenue[dStr] || 0,
                label: LABELS[i],
                frontColor: theme.colors.primary,
                spacing: 2,
                labelTextStyle: { color: '#666' },
            });
            formatted.push({
                value: dailyExpense[dStr] || 0,
                frontColor: '#FF6B6B',
            });
        }
        return formatted;
    }, [dailyRevenue, dailyExpense, monday]);

    const maxVal = useMemo(() => {
        const allValues = [50000, ...Object.values(dailyRevenue), ...Object.values(dailyExpense)];
        const peak = Math.max(...allValues);
        return Math.ceil(peak / 50000) * 50000 + 50000;
    }, [dailyRevenue, dailyExpense]);

    return { chartData, loading, maxVal };
};
