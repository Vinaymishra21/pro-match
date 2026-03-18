// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function AnimatedProfileSection({ index = 0, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const delay = Math.min(index * 100, 600);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(opacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8
        })
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [opacity, translateY, scale, index]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale }]
      }}
    >
      {children}
    </Animated.View>
  );
}
