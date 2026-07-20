import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { useTopInset } from '../../hooks/useTopInset';
import { ReportSheet } from '../../components/ReportSheet';
import { useAuth } from '../../hooks/useAuth';
import { useUnread } from '../../context/UnreadContext';
import { blockUser, getMessages, markMessagesRead, sendMessage, unmatch } from '../../services/apiService';
import { getSocket } from '../../services/socket';
import { ThemedStatusBar, useTheme, useThemedStyles, type ThemeMode } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { buildPromptOpeners, ICEBREAKERS, promptPrefill } from './openers';
import type { DiscoverProfile, MessageRecord, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatLastSeen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? `last seen ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : `last seen ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

export function ChatScreen({ route, navigation }: Props) {
  const { token, user } = useAuth();
  const { refresh: refreshUnread } = useUnread();
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const topPad = useTopInset();
  const { matchId, matchName, matchUserId } = route.params;
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [otherUser, setOtherUser] = useState<DiscoverProfile | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(null);
  const listRef = useRef<FlatList<MessageRecord>>(null);
  const inputRef = useRef<TextInput>(null);
  // Only auto-scroll to the bottom for NEW messages, never when prepending history.
  const pendingScrollEnd = useRef(false);
  // Timers: auto-clear a stale "typing" flag, and debounce my own typing-stop.
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Append a message, de-duping by id. The sender also receives its own
  // broadcast over the socket, and history load may overlap a live event.
  const appendMessage = useCallback((message: MessageRecord) => {
    pendingScrollEnd.current = true;
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  // Older-history pagination: fetch the page before our oldest message and
  // prepend it. maintainVisibleContentPosition keeps the scroll from jumping.
  const loadOlder = useCallback(async () => {
    const oldest = messages[0]?.createdAt;
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await getMessages(matchId, token, oldest);
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...(res.messages || []).filter((m) => !seen.has(m.id)), ...prev];
      });
      setHasMore(Boolean(res.hasMore));
    } catch {
      // Non-fatal: keep what we have; the user can retry by scrolling again.
    } finally {
      setLoadingOlder(false);
    }
  }, [messages, loadingOlder, matchId, token]);

  // Initial history via REST.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError('');
        const response = await getMessages(matchId, token);
        if (active) {
          pendingScrollEnd.current = true;
          setMessages(response.messages || []);
          setHasMore(Boolean(response.hasMore));
          setOtherUser(response.otherUser ?? null);
          // Opening marked their messages read server-side → sync the tab badge.
          refreshUnread();
        }
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
      if (message.matchId !== matchId) return;
      appendMessage(message);
      // Their message arrived while I'm viewing → mark read + sync the badge.
      if (message.senderId !== user?.id) {
        markMessagesRead(matchId, token).then(refreshUnread).catch(() => {});
      }
    };
    // The other person opened the chat → mark my delivered messages as read.
    const handleRead = (payload: { matchId: string; readerId: string; readAt: string }) => {
      if (payload.matchId !== matchId || payload.readerId === user?.id) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderId === user?.id && !m.readAt ? { ...m, readAt: payload.readAt } : m))
      );
    };
    // The other person is typing (auto-clears if their "stopped" event is lost).
    const handleTyping = (payload: { matchId: string; userId: string; typing: boolean }) => {
      if (payload.matchId !== matchId || payload.userId === user?.id) return;
      setOtherTyping(payload.typing);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      if (payload.typing) typingClearRef.current = setTimeout(() => setOtherTyping(false), 4000);
    };
    // The other person's online/last-seen status (only their id is ever sent here).
    const handlePresence = (payload: { userId: string; online: boolean; lastSeen: string | null }) => {
      if (payload.userId === user?.id) return;
      setOtherOnline(payload.online);
      setOtherLastSeen(payload.lastSeen || null);
    };
    const joinRoom = () => socket.emit('match:join', matchId);

    joinRoom();
    socket.on('message:new', handleNew);
    socket.on('messages:read', handleRead);
    socket.on('typing', handleTyping);
    socket.on('presence', handlePresence);
    socket.on('connect', joinRoom); // re-join after a reconnect

    return () => {
      socket.emit('match:leave', matchId);
      socket.off('message:new', handleNew);
      socket.off('messages:read', handleRead);
      socket.off('typing', handleTyping);
      socket.off('presence', handlePresence);
      socket.off('connect', joinRoom);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [matchId, token, appendMessage, user?.id, refreshUnread]);

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

  function emitTyping(typing: boolean) {
    if (!token) return;
    getSocket(token).emit('typing', { matchId, typing });
  }

  // Emit "typing" as the user types; debounce a "stopped" after 2s of no input.
  function handleChangeText(next: string) {
    setText(next);
    emitTyping(true);
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => emitTyping(false), 2000);
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    emitTyping(false);
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

  // Opener suggestions for an empty chat: riff on their profile, or an icebreaker.
  const promptOpeners = useMemo(() => buildPromptOpeners(otherUser), [otherUser]);
  const firstName = matchName?.split(' ')[0] || 'them';

  const pickOpener = useCallback((prefill: string) => {
    setText(prefill);
    inputRef.current?.focus();
  }, []);

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
            <Text style={[styles.headerSub, otherTyping && styles.headerSubActive]} numberOfLines={1}>
              {otherTyping
                ? 'typing…'
                : otherOnline
                ? 'Online'
                : otherLastSeen
                ? formatLastSeen(otherLastSeen)
                : 'Matched · say hello'}
            </Text>
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
          maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
          scrollEventThrottle={200}
          onScroll={(e) => {
            if (e.nativeEvent.contentOffset.y < 60 && hasMore && !loadingOlder) loadOlder();
          }}
          onContentSizeChange={() => {
            if (pendingScrollEnd.current) {
              pendingScrollEnd.current = false;
              listRef.current?.scrollToEnd({ animated: true });
            }
          }}
          ListHeaderComponent={loadingOlder ? <ActivityIndicator style={styles.olderSpinner} color={colors.textMuted} /> : null}
          ListEmptyComponent={
            <View style={styles.openerWrap}>
              <Text style={styles.openerTitle}>Break the ice</Text>
              <Text style={styles.openerSub}>Skip the “hi” — open with something they’ll want to reply to.</Text>

              {promptOpeners.length > 0 ? (
                <>
                  <Text style={styles.openerGroup}>Riff on {firstName}’s profile</Text>
                  {promptOpeners.map((o) => (
                    <Pressable key={o.id} style={styles.promptCard} onPress={() => pickOpener(promptPrefill(o))}>
                      <Text style={styles.promptLabel}>{o.label}</Text>
                      <Text style={styles.promptAnswer} numberOfLines={2}>“{o.answer}”</Text>
                      <Text style={styles.promptCta}>Reply to this ↗</Text>
                    </Pressable>
                  ))}
                </>
              ) : null}

              <Text style={styles.openerGroup}>Or try an icebreaker</Text>
              <View style={styles.chipWrap}>
                {ICEBREAKERS.map((line) => (
                  <Pressable key={line} style={styles.chip} onPress={() => pickOpener(line)}>
                    <Text style={styles.chipText}>{line}</Text>
                  </Pressable>
                ))}
              </View>
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
            ref={inputRef}
            value={text}
            onChangeText={handleChangeText}
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
    headerSubActive: { color: c.brandText },
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
    olderSpinner: { paddingVertical: spacing.sm },
    openerWrap: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm
    },
    openerTitle: {
      ...typography.subtitle,
      color: c.text,
      fontWeight: '900'
    },
    openerSub: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '500',
      marginBottom: spacing.xs
    },
    openerGroup: {
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: c.textMuted,
      fontWeight: '800',
      marginTop: spacing.sm
    },
    promptCard: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: spacing.md,
      gap: 4
    },
    promptLabel: {
      fontSize: 11,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: c.textMuted,
      fontWeight: '700'
    },
    promptAnswer: {
      color: c.text,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20
    },
    promptCta: {
      color: c.brandText,
      fontSize: 12.5,
      fontWeight: '800',
      marginTop: 2
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm
    },
    chip: {
      backgroundColor: c.surfaceStrong,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    chipText: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600'
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
