import React from 'react';
import renderer from 'react-test-renderer';
import { TextInput, TouchableOpacity, Text } from 'react-native';
import { DrivingInputModal } from '../../src/components/DrivingInputModal';
import { createComponent } from '../helpers/renderHook';

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

/** 시간/분/거리 순서로 TextInput을 반환합니다. */
function getInputs(tree: renderer.ReactTestRenderer) {
  const inputs = tree.root.findAllByType(TextInput);
  return { hoursInput: inputs[0], minutesInput: inputs[1], distanceInput: inputs[2] };
}

/** "입력 완료" 버튼을 반환합니다. */
function getSubmitButton(tree: renderer.ReactTestRenderer) {
  return tree.root.findAllByType(TouchableOpacity).find(b =>
    b.findAllByType(Text).some(t =>
      ['입력 완료', '저장 중...'].includes(String(t.props.children)),
    ),
  );
}

beforeEach(() => jest.clearAllMocks());

// ─── 렌더링 ───────────────────────────────────────────────────────────────────

describe('DrivingInputModal — 렌더링', () => {
  test('안내 문구 표시', () => {
    const tree = createComponent(<DrivingInputModal {...defaultProps} />);
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('오늘 하루 총 운행 시간과 거리를 입력해주세요');
  });

  test('헤더 제목 표시', () => {
    const tree = createComponent(<DrivingInputModal {...defaultProps} />);
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('운행 기록 입력');
  });

  test('TextInput 3개 렌더링 (시간/분/거리)', () => {
    const tree = createComponent(<DrivingInputModal {...defaultProps} />);
    expect(tree.root.findAllByType(TextInput)).toHaveLength(3);
  });
});

// ─── 입력 유효성 ──────────────────────────────────────────────────────────────

describe('DrivingInputModal — 입력 유효성', () => {
  test('입력 없으면 제출 버튼 disabled', () => {
    const tree = createComponent(<DrivingInputModal {...defaultProps} />);
    const btn = getSubmitButton(tree);
    expect(btn?.props.disabled).toBe(true);
  });

  test('시간 입력 시 제출 버튼 활성화', () => {
    const tree = createComponent(<DrivingInputModal {...defaultProps} />);
    const { hoursInput } = getInputs(tree);

    renderer.act(() => { hoursInput.props.onChangeText('2'); });

    const btn = getSubmitButton(tree);
    expect(btn?.props.disabled).toBe(false);
  });

  test('거리만 입력해도 제출 버튼 활성화', () => {
    const tree = createComponent(<DrivingInputModal {...defaultProps} />);
    const { distanceInput } = getInputs(tree);

    renderer.act(() => { distanceInput.props.onChangeText('30.5'); });

    const btn = getSubmitButton(tree);
    expect(btn?.props.disabled).toBe(false);
  });

  test('분 59 초과 입력 시 59로 clamp', () => {
    const tree = createComponent(<DrivingInputModal {...defaultProps} />);
    const { minutesInput } = getInputs(tree);

    renderer.act(() => { minutesInput.props.onChangeText('75'); });

    expect(minutesInput.props.value).toBe('59');
  });

  test('분 59 이하는 그대로 허용', () => {
    const tree = createComponent(<DrivingInputModal {...defaultProps} />);
    const { minutesInput } = getInputs(tree);

    renderer.act(() => { minutesInput.props.onChangeText('45'); });

    expect(minutesInput.props.value).toBe('45');
  });
});

// ─── 제출 ─────────────────────────────────────────────────────────────────────

describe('DrivingInputModal — 제출', () => {
  test('시간+분 입력 후 onConfirm에 totalMinutes 전달', () => {
    const onConfirm = jest.fn();
    const tree = createComponent(
      <DrivingInputModal {...defaultProps} onConfirm={onConfirm} />,
    );
    const { hoursInput, minutesInput } = getInputs(tree);

    renderer.act(() => {
      hoursInput.props.onChangeText('1');
      minutesInput.props.onChangeText('30');
    });

    const btn = getSubmitButton(tree);
    renderer.act(() => { btn?.props.onPress(); });

    expect(onConfirm).toHaveBeenCalledWith(90, 0); // 1h 30m = 90분
  });

  test('거리 입력 후 onConfirm에 distanceKm 전달', () => {
    const onConfirm = jest.fn();
    const tree = createComponent(
      <DrivingInputModal {...defaultProps} onConfirm={onConfirm} />,
    );
    const { distanceInput } = getInputs(tree);

    renderer.act(() => { distanceInput.props.onChangeText('42.5'); });

    const btn = getSubmitButton(tree);
    renderer.act(() => { btn?.props.onPress(); });

    expect(onConfirm).toHaveBeenCalledWith(0, 42.5);
  });

  test('제출 후 onClose 호출', () => {
    const onClose = jest.fn();
    const tree = createComponent(
      <DrivingInputModal {...defaultProps} onClose={onClose} />,
    );
    const { hoursInput } = getInputs(tree);

    renderer.act(() => { hoursInput.props.onChangeText('1'); });

    const btn = getSubmitButton(tree);
    renderer.act(() => { btn?.props.onPress(); });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── 닫기 ─────────────────────────────────────────────────────────────────────

describe('DrivingInputModal — 닫기', () => {
  test('X 버튼 누르면 onClose 호출', () => {
    const onClose = jest.fn();
    const tree = createComponent(
      <DrivingInputModal {...defaultProps} onClose={onClose} />,
    );

    const closeBtn = tree.root.findAllByType(TouchableOpacity).find(b =>
      b.findAllByType(Text).some(t => t.props.children === '✕'),
    );

    renderer.act(() => { closeBtn?.props.onPress(); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('닫기 후 입력값 초기화', () => {
    const onClose = jest.fn();
    const tree = createComponent(
      <DrivingInputModal {...defaultProps} onClose={onClose} />,
    );
    const { hoursInput } = getInputs(tree);

    renderer.act(() => { hoursInput.props.onChangeText('3'); });
    expect(hoursInput.props.value).toBe('3');

    const closeBtn = tree.root.findAllByType(TouchableOpacity).find(b =>
      b.findAllByType(Text).some(t => t.props.children === '✕'),
    );
    renderer.act(() => { closeBtn?.props.onPress(); });

    expect(hoursInput.props.value).toBe('');
  });
});
