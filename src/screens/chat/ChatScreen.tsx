import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { getMessages, sendMessage } from '../../services/apiService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { MessageRecord, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route }: Props) {
  const { token, user } = useAuth();
  const { matchId, matchName } = route.params;
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const loadMessages = useCallback(async () => {
    try {
      setError('');
      const response = await getMessages(matchId, token);
      setMessages(response.messages || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [matchId, token]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function handleSend() {
    if (!text.trim()) {
      return;
    }

    try {
      await sendMessage(matchId, text.trim(), token);
      setText('');
      await loadMessages();
    } catch (sendError) {
      setError(sendError.message);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.heading}>{matchName}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={styles.bubbleText}>{item.text}</Text>
              </View>
            );
          }}
        />

        <AppInput value={text} onChangeText={setText} placeholder="Type a message" />
        <AppButton title="Send" onPress={handleSend} disabled={!text.trim()} />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  heading: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md
  },
  messageList: {
    paddingBottom: spacing.lg
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  bubbleText: {
    color: colors.text
  },
  error: {
    color: '#FCA5A5',
    marginBottom: spacing.sm
  }
});
