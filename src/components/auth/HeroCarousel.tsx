import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors } from '../../theme/darkColors';

// Curated remote heroes (swap for your own branded images later). Portrait,
// warm/romantic, work well under a dark scrim.
export const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80', // colleagues laughing
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900&q=80', // couple coffee
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&q=80', // group friends
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&q=80', // professional smiling
  'https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=900&q=80' // candid pair
];

// A full-bleed background carousel: each image cross-fades in while slowly
// zooming (Ken Burns), giving a premium "alive" feel without video weight.
// A dark gradient scrim sits on top so foreground text stays readable.
export function HeroCarousel({
  images = HERO_IMAGES,
  interval = 5000
}: {
  images?: string[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const zoom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow continuous zoom on the current image.
    zoom.setValue(0);
    Animated.timing(zoom, {
      toValue: 1,
      duration: interval + 1200,
      easing: Easing.linear,
      useNativeDriver: true
    }).start();

    const t = setTimeout(() => {
      // Cross-fade out, advance, fade back in.
      Animated.timing(fade, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % images.length);
        Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      });
    }, interval);

    return () => clearTimeout(t);
  }, [index, images.length, interval, fade, zoom]);

  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1.16] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.imgBase} />
      <Animated.Image
        source={{ uri: images[index] }}
        style={[StyleSheet.absoluteFill, { opacity: fade, transform: [{ scale }] }]}
        resizeMode="cover"
        blurRadius={0}
      />
      {/* Dark scrim — keeps the brand dark and text readable over any photo */}
      <LinearGradient
        colors={['rgba(14,11,20,0.55)', 'rgba(14,11,20,0.78)', 'rgba(14,11,20,0.96)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* progress dots */}
      <View style={styles.dots}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, i === index ? styles.dotActive : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: darkColors.card },
  dots: { position: 'absolute', top: 14, alignSelf: 'center', flexDirection: 'row', gap: 6, zIndex: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 18, backgroundColor: '#fff' }
});
