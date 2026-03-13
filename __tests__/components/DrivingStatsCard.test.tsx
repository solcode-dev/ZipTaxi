import React from 'react';
import { Text } from 'react-native';
import { DrivingStatsCard } from '../../src/components/DrivingStatsCard';
import { createComponent } from '../helpers/renderHook';

describe('DrivingStatsCard', () => {
  it('운행 시간이 0분일 경우 컴포넌트를 렌더링하지 않는다 (null 반환)', () => {
    const tree = createComponent(
      <DrivingStatsCard
        monthlyDrivingMinutes={0}
        monthlyDistanceKm={0}
        perHour={null}
        perKm={null}
        prevPerHour={null}
        prevPerKm={null}
      />
    );
    expect(tree.toJSON()).toBeNull();
  });

  it('기본 운행 데이터가 주어졌을 때 올바르게 렌더링된다', () => {
    const tree = createComponent(
      <DrivingStatsCard
        monthlyDrivingMinutes={135} // 2시간 15분
        monthlyDistanceKm={105.5}
        perHour={15000}
        perKm={850}
        prevPerHour={null}
        prevPerKm={null}
      />
    );
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    
    // 시간당/km당 순수익 (가공된 문자열 등 배열/조합 텍스트 확인 필요)
    expect(texts.flat(Infinity).join('')).toContain('15,000');
    expect(texts.flat(Infinity).join('')).toContain('850');
    
    // 포맷팅된 총 운행 시간과 거리 
    expect(texts).toContain('2시간 15분');
    expect(texts.flat(Infinity).join('')).toContain('105.5 km');
  });

  it('전월 대비 효율(perHour, perKm)이 증가했을 때 비율 뱃지를 잘 렌더링한다', () => {
    const tree = createComponent(
      <DrivingStatsCard
        monthlyDrivingMinutes={200}
        monthlyDistanceKm={150}
        perHour={18000}
        perKm={880}
        prevPerHour={15000}
        prevPerKm={800}
      />
    );
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts.flat(Infinity).join('')).toContain('+20%');
    expect(texts.flat(Infinity).join('')).toContain('+10% 전월 대비');
  });

  it('전월 대비 효율(perHour, perKm)이 감소했을 때 비율 뱃지를 잘 렌더링한다', () => {
    const tree = createComponent(
      <DrivingStatsCard
        monthlyDrivingMinutes={200}
        monthlyDistanceKm={150}
        perHour={18000}
        perKm={950}
        prevPerHour={20000}
        prevPerKm={1000}
      />
    );
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts.flat(Infinity).join('')).toContain('-10%');
    expect(texts.flat(Infinity).join('')).toContain('-5% 전월 대비');
  });
});

