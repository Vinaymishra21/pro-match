import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.logo}>Pro Match</Text>
        <Text style={styles.tagline}>Same profession. Better conversations.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    ...typography.title,
    color: colors.text,
    marginBottom: 8
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center'
  }
});
