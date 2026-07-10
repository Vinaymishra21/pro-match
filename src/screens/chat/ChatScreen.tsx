import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { useTopInset } from '../../hooks/useTopInset';
import { ReportSheet } from '../../components/ReportSheet';
import { useAuth } from '../../hooks/useAuth';
import { blockUser, getMessages, sendMessage, unmatch } from '../../services/apiService';
import { getSocket } from '../../services/socket';
import { ThemedStatusBar, useTheme, useThemedStyles, type ThemeMode } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
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
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const topPad = useTopInset();
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

  function confirmUnmatch() {
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
    ]);
  }

  function openActions() {
    Alert.alert(matchName, 'Manage this match', [
      { text: 'Report', onPress: () => setReportOpen(true) },
      { text: 'Unmatch', style: 'destructive', onPress: confirmUnmatch },
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

  const canSend = Boolean(text.trim());

  return (
    <DarkBackground orbColor="rgba(232,65,90,0.18)">
      <ThemedStatusBar />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={[
          styles.container,
          {
            // Floor insets.top: edge-to-edge Android can report it as 0.
            paddingTop: topPad + spacing.xs,
            paddingBottom: insets.bottom + spacing.xs
          }
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.heading} numberOfLines={1}>{matchName}</Text>
            <Text style={styles.headerSub}>Matched · say hello</Text>
          </View>
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
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyHint}>Say hi 👋 Start the conversation.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
                {mine ? (
                  <LinearGradient
                    colors={colors.brandGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.bubble, styles.bubbleMine]}
                  >
                    <Text style={[styles.bubbleText, styles.bubbleTextMine]}>{item.text}</Text>
                    <Text style={[styles.timestamp, styles.timestampMine]}>
                      {formatTime(item.createdAt)}
                      {item.readAt ? ' · Read' : ''}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.bubble, styles.bubbleOther]}>
                    <Text style={styles.bubbleText}>{item.text}</Text>
                    <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
                  </View>
                )}
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            placeholderTextColor={colors.textMuted}
            style={styles.composerInput}
            multiline
            onSubmitEditing={handleSend}
          />
          <Pressable onPress={handleSend} disabled={!canSend} style={styles.sendWrap}>
            <LinearGradient
              // Disabled state: the white wash predates the theme system — keep it
              // byte-identical in dark, use the ink wash on cream.
              colors={
                canSend
                  ? colors.brandGradient
                  : mode === 'dark'
                  ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)']
                  : [colors.surfaceStrong, colors.surfaceStrong]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendBtn}
            >
              <Text style={[styles.sendIcon, !canSend && styles.sendIconOff]}>➤</Text>
            </LinearGradient>
          </Pressable>
        </View>
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
    </DarkBackground>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border
    },
    backChevron: {
      fontSize: 28,
      lineHeight: 38,
      color: c.text,
      fontWeight: '600',
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false
    },
    headerCenter: { flex: 1 },
    heading: {
      ...typography.subtitle,
      color: c.text,
      fontWeight: '900'
    },
    headerSub: {
      fontSize: 12,
      color: c.textMuted,
      fontWeight: '600',
      marginTop: 1
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border
    },
    menuDots: {
      fontSize: 22,
      lineHeight: 38,
      color: c.text,
      fontWeight: '800',
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false
    },
    messageList: {
      paddingBottom: spacing.md,
      flexGrow: 1
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xxl
    },
    emptyEmoji: { fontSize: 44, marginBottom: spacing.sm },
    emptyHint: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center'
    },
    bubbleRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm
    },
    bubbleRowMine: { justifyContent: 'flex-end' },
    bubbleRowOther: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '82%',
      borderRadius: 20,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    bubbleMine: {
      borderBottomRightRadius: 6
    },
    bubbleOther: {
      backgroundColor: c.surfaceStrong,
      borderWidth: 1,
      borderColor: c.border,
      borderBottomLeftRadius: 6
    },
    bubbleText: {
      color: c.text,
      fontSize: 15,
      lineHeight: 20
    },
    // My bubble is the brand gradient in both modes — white text stays.
    bubbleTextMine: {
      color: '#FFFFFF'
    },
    timestamp: {
      ...typography.caption,
      fontSize: 10,
      color: c.textMuted,
      marginTop: 4,
      alignSelf: 'flex-end'
    },
    timestampMine: {
      color: 'rgba(255,255,255,0.75)'
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingTop: spacing.sm
    },
    composerInput: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 24,
      paddingHorizontal: spacing.md,
      paddingTop: 12,
      paddingBottom: 12,
      color: c.text,
      fontSize: 15
    },
    sendWrap: { marginBottom: 2 },
    sendBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center'
    },
    // White on the brand-gradient send button — correct in both modes.
    sendIcon: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '900',
      marginLeft: 2
    },
    sendIconOff: {
      color: c.textMuted
    },
    // '#FCA5A5' predates the theme system; keep it byte-identical in dark,
    // use the palette's AA-checked danger tone in light.
    error: {
      color: mode === 'dark' ? '#FCA5A5' : c.danger,
      marginBottom: spacing.sm
    }
  });
