import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { DrivingPatternInsight } from '../../src/components/DrivingPatternInsight';
import { createComponent } from '../helpers/renderHook';

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

const PATTERN_LABELS = ['단거리 시내형', '혼합형', '장거리 고속형'];

/** 렌더링된 트리에서 pattern label Text를 찾아 반환합니다. */
function getLabel(tree: renderer.ReactTestRenderer): string | null {
  const texts = tree.root.findAllByType(Text);
  const found = texts.find(t => PATTERN_LABELS.includes(String(t.props.children)));
  return found ? String(found.props.children) : null;
}

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('DrivingPatternInsight — 빈 데이터', () => {
  test('drivingMinutes가 0이면 null 반환', () => {
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={0} distanceKm={100} />,
    );
    expect(tree.toJSON()).toBeNull();
  });

  test('distanceKm이 0이면 null 반환', () => {
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={120} distanceKm={0} />,
    );
    expect(tree.toJSON()).toBeNull();
  });

  test('둘 다 0이면 null 반환', () => {
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={0} distanceKm={0} />,
    );
    expect(tree.toJSON()).toBeNull();
  });
});

describe('DrivingPatternInsight — 패턴 분류', () => {
  test('평균 15 km/h → 단거리 시내형', () => {
    // 60분, 15km → 15 km/h
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={60} distanceKm={15} />,
    );
    expect(getLabel(tree)).toBe('단거리 시내형');
  });

  test('평균 24.9 km/h (경계 미만) → 단거리 시내형', () => {
    // 120분, 49.8km → 24.9 km/h
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={120} distanceKm={49.8} />,
    );
    expect(getLabel(tree)).toBe('단거리 시내형');
  });

  test('평균 30 km/h → 혼합형', () => {
    // 60분, 30km → 30 km/h
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={60} distanceKm={30} />,
    );
    expect(getLabel(tree)).toBe('혼합형');
  });

  test('평균 25 km/h (경계값) → 혼합형', () => {
    // 120분, 50km → 25 km/h
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={120} distanceKm={50} />,
    );
    expect(getLabel(tree)).toBe('혼합형');
  });

  test('평균 44.9 km/h (경계 미만) → 혼합형', () => {
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={120} distanceKm={89.8} />,
    );
    expect(getLabel(tree)).toBe('혼합형');
  });

  test('평균 60 km/h → 장거리 고속형', () => {
    // 60분, 60km → 60 km/h
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={60} distanceKm={60} />,
    );
    expect(getLabel(tree)).toBe('장거리 고속형');
  });

  test('평균 45 km/h (경계값) → 장거리 고속형', () => {
    // 120분, 90km → 45 km/h
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={120} distanceKm={90} />,
    );
    expect(getLabel(tree)).toBe('장거리 고속형');
  });
});

describe('DrivingPatternInsight — 렌더링', () => {
  test('데이터 있으면 null이 아님', () => {
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={60} distanceKm={30} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });

  test('스냅샷 — 혼합형', () => {
    const tree = createComponent(
      <DrivingPatternInsight drivingMinutes={60} distanceKm={30} />,
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
