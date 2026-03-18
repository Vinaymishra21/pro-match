import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const HERO_IMAGE =
  'https://storage.googleapis.com/banani-generated-images/generated-images/3d16cfdd-18b6-4b1a-a8e2-4a608184d399.jpg';

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.screen} imageStyle={styles.backgroundImage}>
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            {/* <View style={styles.logoBadge}>
              <Text style={styles.logoMark}>♡</Text>
            </View> */}
            <Text style={styles.brand}>Pro <View style={styles.logoBadge}>
              <Text style={styles.logoMark}>♡</Text>
            </View> Match</Text>
          </View>
          <Text style={styles.tagline}>Love stories made in heaven</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}
            onPress={() => navigation.navigate('PhoneEntry')}
          >
            <Text style={styles.primaryLabel}>Create an account</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.secondaryPressed : null]}
            onPress={() => navigation.navigate('Auth', { initialMode: 'login' })}
          >
            <Text style={styles.secondaryLabel}>I have an account</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#13090C'
  },
  backgroundImage: {
    resizeMode: 'cover'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 4, 7, 0.28)'
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 112,
    paddingBottom: 42
  },
  header: {
    alignItems: 'center',
    gap: 18
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)'
  },
  logoMark: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 28
  },
  brand: {
    color: colors.white,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1.4
  },
  tagline: {
    color: 'rgba(255,255,255,0.96)',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: 260
  },
  actions: {
    gap: 14
  },
  primaryButton: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B8A',
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8
  },
  secondaryButton: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.82)'
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }]
  },
  secondaryPressed: {
    backgroundColor: 'rgba(255,255,255,0.14)'
  },
  primaryLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1
  },
  secondaryLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1
  }
});
