import React from 'react';
import renderer from 'react-test-renderer';

/**
 * react-test-renderer 기반의 최소 renderHook 구현.
 * @testing-library 없이 훅의 반환값을 동기적으로 추출합니다.
 */
export function renderHook<T>(useHook: () => T): { result: { current: T } } {
  const result = { current: null as unknown as T };

  const TestComponent = () => {
    result.current = useHook();
    return null;
  };

  renderer.act(() => {
    renderer.create(React.createElement(TestComponent));
  });

  return { result };
}

/**
 * renderer.create()를 act()로 감싼 헬퍼.
 * Modal 등 비동기 상태 업데이트를 유발하는 컴포넌트에 필요합니다.
 */
export function createComponent(element: React.ReactElement): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(element);
  });
  return tree;
}
