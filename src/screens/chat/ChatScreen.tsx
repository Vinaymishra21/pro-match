import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { getMessages, sendMessage } from '../../services/apiService';
import { getSocket } from '../../services/socket';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { MessageRecord, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ChatScreen({ route }: Props) {
  const { token, user } = useAuth();
  const { matchId, matchName } = route.params;
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<MessageRecord>>(null);

  // Append a message, de-duping by id. The sender also receives its own
  // broadcast over the socket, and history load may overlap a live event.
  const appendMessage = useCallback((message: MessageRecord) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  // Initial history via REST.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError('');
        const response = await getMessages(matchId, token);
        if (active) setMessages(response.messages || []);
      } catch (loadError) {
        if (active) setError((loadError as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [matchId, token]);

  // Live updates via Socket.IO: join the match room, listen for new messages.
  useEffect(() => {
    if (!token) return undefined;

    const socket = getSocket(token);
    const handleNew = (message: MessageRecord) => {
      if (message.matchId === matchId) appendMessage(message);
    };
    const joinRoom = () => socket.emit('match:join', matchId);

    joinRoom();
    socket.on('message:new', handleNew);
    socket.on('connect', joinRoom); // re-join after a reconnect

    return () => {
      socket.emit('match:leave', matchId);
      socket.off('message:new', handleNew);
      socket.off('connect', joinRoom);
    };
  }, [matchId, token, appendMessage]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText('');
    try {
      // REST send persists + the server broadcasts it back; appendMessage de-dupes.
      const response = await sendMessage(matchId, trimmed, token);
      if (response.message) appendMessage(response.message);
    } catch (sendError) {
      setText(trimmed); // restore on failure so the user doesn't lose it
      setError((sendError as Error).message);
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
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.emptyHint}>Say hi 👋 Start the conversation.</Text>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : null]}>{item.text}</Text>
                <Text style={[styles.timestamp, mine ? styles.timestampMine : null]}>
                  {formatTime(item.createdAt)}
                  {mine && item.readAt ? ' · Read' : ''}
                </Text>
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
    paddingBottom: spacing.lg,
    flexGrow: 1
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
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
    color: colors.text,
    fontSize: 15
  },
  bubbleTextMine: {
    color: colors.white
  },
  timestamp: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  timestampMine: {
    color: 'rgba(255,255,255,0.8)'
  },
  error: {
    color: '#FCA5A5',
    marginBottom: spacing.sm
  }
});
