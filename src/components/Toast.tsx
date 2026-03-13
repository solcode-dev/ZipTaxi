import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export const Toast = ({ message, visible, onHide, duration = 2000 }: ToastProps) => {
  const opacity   = useRef(new Animated.Value(0)).current;
  const onHideRef = useRef(onHide);

  useEffect(() => { onHideRef.current = onHide; }, [onHide]);

  useEffect(() => {
    if (!visible) return;

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onHideRef.current();
    });
  }, [visible, duration]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(50,50,50,0.88)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  message: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
