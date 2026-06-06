import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../theme/gradients';
import { colors } from '../theme/colors';

type GradientButtonProps = {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  colors?: readonly [string, string, ...string[]];
  icon?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function GradientButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  colors: gradientColors = gradients.brand,
  icon,
  style,
  size = 'lg'
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 300, friction: 10 }).start();
  }, [scale]);
  const handleOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start();
  }, [scale]);

  const isDisabled = disabled || loading;

  return (
    <AnimatedView style={[{ transform: [{ scale }] }, style]}>
      <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut} disabled={isDisabled}>
        <LinearGradient
          colors={isDisabled ? ['#C7D2E0', '#B7C4D6'] : (gradientColors as [string, string, ...string[]])}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, size === 'md' ? styles.md : styles.lg]}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.label}>
              {icon ? `${icon}  ` : ''}
              {title}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E76F51',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6
  },
  lg: { height: 58, paddingHorizontal: 28 },
  md: { height: 46, paddingHorizontal: 20 },
  label: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3
  }
});
