import React from 'react';
import renderer from 'react-test-renderer';
import { Text, Animated } from 'react-native';
import { Toast } from '../../src/components/Toast';
import { createComponent } from '../helpers/renderHook';

// Animated 메서드를 no-op으로 대체 (jest.mock 대신 spyOn 사용)
beforeAll(() => {
  jest.spyOn(Animated, 'sequence').mockReturnValue({ start: jest.fn() } as any);
  jest.spyOn(Animated, 'timing').mockReturnValue({ start: jest.fn() } as any);
  jest.spyOn(Animated, 'delay').mockReturnValue({ start: jest.fn() } as any);
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('Toast — 가시성', () => {
  test('visible=false이면 null 반환', () => {
    const tree = createComponent(
      <Toast visible={false} message="저장됐습니다" onHide={jest.fn()} />,
    );
    expect(tree.toJSON()).toBeNull();
  });

  test('visible=true이면 렌더링', () => {
    const tree = createComponent(
      <Toast visible message="저장됐습니다" onHide={jest.fn()} />,
    );
    expect(tree.toJSON()).not.toBeNull();
  });
});

describe('Toast — 메시지', () => {
  test('message prop이 화면에 표시됨', () => {
    const tree = createComponent(
      <Toast visible message="운행 기록이 저장됐습니다" onHide={jest.fn()} />,
    );
    const text = tree.root.findByType(Text);
    expect(text.props.children).toBe('운행 기록이 저장됐습니다');
  });

  test('message가 변경되면 새 메시지 표시', () => {
    const tree = createComponent(
      <Toast visible message="첫 번째 메시지" onHide={jest.fn()} />,
    );
    renderer.act(() => {
      tree.update(<Toast visible message="두 번째 메시지" onHide={jest.fn()} />);
    });
    const text = tree.root.findByType(Text);
    expect(text.props.children).toBe('두 번째 메시지');
  });
});

describe('Toast — 스냅샷', () => {
  test('visible=true 스냅샷', () => {
    const tree = createComponent(
      <Toast visible message="저장됐습니다" onHide={jest.fn()} />,
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
