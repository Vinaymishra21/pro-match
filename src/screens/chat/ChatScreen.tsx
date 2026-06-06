import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ReportSheet } from '../../components/ReportSheet';
import { useAuth } from '../../hooks/useAuth';
import { blockUser, getMessages, sendMessage, unmatch } from '../../services/apiService';
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

export function ChatScreen({ route, navigation }: Props) {
  const { token, user } = useAuth();
  const { matchId, matchName, matchUserId } = route.params;
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
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

  function openActions() {
    Alert.alert(matchName, 'Manage this match', [
      { text: 'Report', onPress: () => setReportOpen(true) },
      {
        text: 'Unmatch',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Unmatch?', `You'll no longer see ${matchName} or this conversation.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Unmatch',
              style: 'destructive',
              onPress: async () => {
                try {
                  await unmatch(matchId, token);
                  navigation.goBack();
                } catch (e) {
                  Alert.alert('Could not unmatch', (e as Error).message);
                }
              }
            }
          ])
      },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          if (!matchUserId) {
            Alert.alert('Unavailable', 'Reopen this chat from Matches to block.');
            return;
          }
          Alert.alert('Block?', `${matchName} won't be able to see or contact you.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                try {
                  await blockUser(matchUserId, token);
                  navigation.goBack();
                } catch (e) {
                  Alert.alert('Could not block', (e as Error).message);
                }
              }
            }
          ]);
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

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
        <View style={styles.headerRow}>
          <Text style={styles.heading}>{matchName}</Text>
          <Pressable onPress={openActions} hitSlop={12} style={styles.menuBtn}>
            <Text style={styles.menuDots}>⋯</Text>
          </Pressable>
        </View>
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

      <ReportSheet
        visible={reportOpen}
        userId={matchUserId}
        name={matchName}
        onClose={() => setReportOpen(false)}
        onReported={(blocked) => {
          if (blocked) navigation.goBack();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  heading: {
    ...typography.subtitle,
    color: colors.text
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg
  },
  menuDots: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '800',
    marginTop: -4
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
