import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function WelcomeScreen({ navigation }) {
  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <Text style={styles.heading}>Match With People In Your Profession</Text>
        <Text style={styles.subheading}>
          Swipe and connect with people who understand your work and lifestyle.
        </Text>
      </View>
      <AppButton title="Get Started" onPress={() => navigation.navigate('Auth')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center'
  },
  heading: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md
  },
  subheading: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24
  }
});
