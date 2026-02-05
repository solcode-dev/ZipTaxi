import { useState, useEffect } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from '@react-native-firebase/firestore';
import { theme } from '../theme';

/**
 * [주간 수입 데이터 조회 훅]
 * 이번 주(월요일 ~ 일요일)의 일별 수입 합계를 실시간으로 집계하여
 * 차트 라이브러리(react-native-gifted-charts) 형식에 맞게 반환합니다.
 */
export const useWeeklyRevenue = () => {
    const [chartData, setChartData] = useState<any[]>([]); // 차트에 표시될 데이터 배열
    const [loading, setLoading] = useState(true);        // 로딩 상태
    const [maxVal, setMaxVal] = useState(100000);         // 차트의 최대 Y축 값

    useEffect(() => {
        const user = firebaseAuth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        /**
         * 1. 이번 주의 시작일(월요일) 계산
         * 자바스크립트 Date 객체를 사용하여 현재 날짜의 월요일 0시 0분 0초를 구합니다.
         */
        const now = new Date();
        const day = now.getDay(); // 0(일) ~ 6(토)
        // 월요일이 주 시작이므로 조정 (일요일이면 -6, 그외에는 1-day 만큼 이동)
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        const startStr = monday.toISOString().split('T')[0];

        /**
         * 2. Firestore 쿼리 실행
         * 이번 주 월요일 이후의 모든 수입 내역을 실시간으로 감시합니다.
         */
        const q = query(
            collection(firebaseDb, 'users', user.uid, 'revenues'),
            where('dateStr', '>=', startStr)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // 날짜별 수입을 임시 저장할 맵 (key: "YYYY-MM-DD", value: 합계)
            const dailyMap: Record<string, number> = {};
            
            snapshot.docs.forEach((doc: any) => {
                const data = doc.data();
                const d = data.dateStr;
                dailyMap[d] = (dailyMap[d] || 0) + (data.amount || 0);
            });

            // 3. 차트용 데이터 가공 (월~일 순서 고정)
            const labels = ['월', '화', '수', '목', '금', '토', '일'];
            const formatted: any[] = [];
            let currentMax = 50000; // 차트 높이 최소값

            for (let i = 0; i < 7; i++) {
                // 각 요일의 날짜 계산
                const date = new Date(monday);
                date.setDate(monday.getDate() + i);
                const dStr = date.toISOString().split('T')[0];
                const revenue = dailyMap[dStr] || 0;

                // [수입 막대]
                formatted.push({
                    value: revenue,
                    label: labels[i],
                    frontColor: theme.colors.primary,
                    spacing: 2,
                    labelTextStyle: { color: '#666' }
                });
                
                // [비용 막대] : 현재 비용 데이터가 없으므로 0으로 고정
                formatted.push({ 
                    value: 0, 
                    frontColor: '#FF6B6B' 
                });
                
                // 차트의 최대 눈금을 정하기 위해 가장 큰 수입을 찾습니다.
                if (revenue > currentMax) currentMax = revenue;
            }

            setChartData(formatted);
            // Y축 최대값을 데이터보다 조금 더 높게 설정 (가독성 증대)
            setMaxVal(Math.ceil(currentMax / 50000) * 50000 + 50000);
            setLoading(false);
        }, (error) => {
            console.error("주간 차트 데이터 로드 에러:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { chartData, loading, maxVal };
};
