import React from 'react';
import { Alert, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { DEV_BYPASS_AUTH } from '../../constants/config';
import { colors } from '../../theme/colors';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'LoginMethod'>;

const HERO_IMAGE =
  'https://storage.googleapis.com/banani-generated-images/generated-images/3d16cfdd-18b6-4b1a-a8e2-4a608184d399.jpg';

export function LoginMethodScreen({ navigation }: Props) {
  const { devBypass } = useAuth();

  // In dev, social buttons fast-track login via the backend dev OTP.
  // In production they'll be wired to real OAuth (not yet implemented).
  async function handleSocial() {
    if (DEV_BYPASS_AUTH) {
      try {
        await devBypass();
      } catch (error) {
        Alert.alert('Dev login failed', (error as Error).message);
      }
      return;
    }
    Alert.alert('Coming soon', 'Social login is not available yet. Please use your phone number.');
  }
  return (
    <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.screen} imageStyle={styles.backgroundImage}>
      <StatusBar style="light" />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
            <Text style={styles.backLabel}>←</Text>
          </Pressable>

          <Text style={styles.title}>Welcome{'\n'}back</Text>
          <Text style={styles.subtitle}>Choose how you'd like to log in</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.methodButton, styles.phoneButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('PhoneEntry')}
          >
            <View style={styles.methodIcon}>
              <Text style={styles.methodIconText}>📱</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Use mobile number</Text>
              <Text style={styles.methodHint}>Log in with your phone number</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.methodButton, styles.googleButton, pressed && styles.buttonPressed]}
            onPress={handleSocial}
          >
            <View style={[styles.methodIcon, styles.googleIcon]}>
              <Text style={styles.methodIconText}>G</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Continue with Google</Text>
              <Text style={styles.methodHint}>Log in with your Google account</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.methodButton, styles.facebookButton, pressed && styles.buttonPressed]}
            onPress={handleSocial}
          >
            <View style={[styles.methodIcon, styles.facebookIcon]}>
              <Text style={styles.methodIconText}>f</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Continue with Facebook</Text>
              <Text style={styles.methodHint}>Log in using your Facebook profile</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.emailButton, pressed && styles.emailButtonPressed]}
            onPress={() => navigation.navigate('Auth', { initialMode: 'login' })}
          >
            <Text style={styles.emailLabel}>Log in with Email</Text>
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <Text style={styles.signupLink} onPress={() => navigation.navigate('SignUpMethod')}>
              {' '}Sign up
            </Text>
          </View>
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
    backgroundColor: 'rgba(8, 4, 7, 0.55)'
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 36
  },
  header: {
    gap: 12
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8
  },
  backLabel: {
    fontSize: 22,
    color: colors.white
  },
  title: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 44
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24
  },
  actions: {
    gap: 12
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1
  },
  phoneButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)'
  },
  googleButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)'
  },
  facebookButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)'
  },
  buttonPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ scale: 0.99 }]
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B8A',
    marginRight: 14
  },
  googleIcon: {
    backgroundColor: '#FFFFFF'
  },
  facebookIcon: {
    backgroundColor: '#1877F2'
  },
  methodIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white
  },
  methodInfo: {
    flex: 1
  },
  methodTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2
  },
  methodHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12.5,
    fontWeight: '500'
  },
  chevron: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  dividerText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16
  },
  emailButton: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)'
  },
  emailButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  emailLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 4
  },
  signupText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14
  },
  signupLink: {
    color: '#FF6B8A',
    fontSize: 14,
    fontWeight: '700'
  }
});
