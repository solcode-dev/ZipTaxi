import React from 'react';
import renderer from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import { CustomAlert } from '../../src/components/CustomAlert';
import { createComponent } from '../helpers/renderHook';

const defaultProps = {
  visible: true,
  title: '로그아웃',
  message: '정말 로그아웃 하시겠습니까?',
  onClose: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('CustomAlert — 렌더링', () => {
  test('title과 message가 표시됨', () => {
    const tree = createComponent(<CustomAlert {...defaultProps} />);
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('로그아웃');
    expect(texts).toContain('정말 로그아웃 하시겠습니까?');
  });

  test('confirmText 기본값은 "확인"', () => {
    const tree = createComponent(<CustomAlert {...defaultProps} />);
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('확인');
  });

  test('confirmText prop 적용', () => {
    const tree = createComponent(
      <CustomAlert {...defaultProps} confirmText="로그아웃" />,
    );
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('로그아웃');
  });

  test('onCancel 없으면 취소 버튼 미표시', () => {
    const tree = createComponent(<CustomAlert {...defaultProps} />);
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).not.toContain('취소');
  });

  test('onCancel 있으면 취소 버튼 표시', () => {
    const tree = createComponent(
      <CustomAlert {...defaultProps} onCancel={jest.fn()} />,
    );
    const texts = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('취소');
  });
});

describe('CustomAlert — 인터랙션', () => {
  test('확인 버튼 누르면 onConfirm 호출', () => {
    const onConfirm = jest.fn();
    const onClose   = jest.fn();
    const tree = createComponent(
      <CustomAlert {...defaultProps} onConfirm={onConfirm} onClose={onClose} confirmText="확인" />,
    );

    const buttons = tree.root.findAllByType(TouchableOpacity);
    const confirmBtn = buttons.find(b =>
      b.findAllByType(Text).some(t => t.props.children === '확인'),
    );

    renderer.act(() => { confirmBtn?.props.onPress(); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('확인 버튼 누르면 onClose 자동 호출', () => {
    const onClose = jest.fn();
    const tree = createComponent(
      <CustomAlert {...defaultProps} onClose={onClose} confirmText="확인" />,
    );

    const buttons = tree.root.findAllByType(TouchableOpacity);
    const confirmBtn = buttons.find(b =>
      b.findAllByType(Text).some(t => t.props.children === '확인'),
    );

    renderer.act(() => { confirmBtn?.props.onPress(); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('취소 버튼 누르면 onCancel 호출', () => {
    const onCancel = jest.fn();
    const tree = createComponent(
      <CustomAlert {...defaultProps} onCancel={onCancel} />,
    );

    const buttons = tree.root.findAllByType(TouchableOpacity);
    const cancelBtn = buttons.find(b =>
      b.findAllByType(Text).some(t => t.props.children === '취소'),
    );

    renderer.act(() => { cancelBtn?.props.onPress(); });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
