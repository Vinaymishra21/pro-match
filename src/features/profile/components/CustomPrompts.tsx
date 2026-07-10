import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { promptPool } from '../constants/profileOptions';
import { useTheme, useThemedStyles, type ThemeMode } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme/themes';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const MAX_PROMPTS = 3;
const MAX_CHARS = 250;

// Lets users pick up to 3 prompts from a pool and answer them.
export function CustomPrompts({ value = [], onChange }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [picking, setPicking] = useState(false);

  const used = value.map((p) => p.prompt);
  const available = promptPool.filter((p) => !used.includes(p));

  function addPrompt(prompt) {
    if (value.length >= MAX_PROMPTS) return;
    onChange([...value, { prompt, answer: '' }]);
    setPicking(false);
  }

  function updateAnswer(index, answer) {
    if (answer.length > MAX_CHARS) return;
    const next = value.map((p, i) => (i === index ? { ...p, answer } : p));
    onChange(next);
  }

  function removePrompt(index) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <View>
      {value.map((item, index) => (
        <View key={`${item.prompt}-${index}`} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.prompt}>{item.prompt}</Text>
            <Pressable onPress={() => removePrompt(index)} hitSlop={8}>
              <Text style={styles.remove}>×</Text>
            </Pressable>
          </View>
          <TextInput
            value={item.answer}
            onChangeText={(t) => updateAnswer(index, t)}
            placeholder="Your answer…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.input}
          />
          <Text style={styles.count}>
            {item.answer.length}/{MAX_CHARS}
          </Text>
        </View>
      ))}

      {value.length < MAX_PROMPTS ? (
        <Pressable style={styles.addBtn} onPress={() => setPicking(true)}>
          <Text style={styles.addPlus}>+</Text>
          <Text style={styles.addLabel}>
            Add a prompt ({value.length}/{MAX_PROMPTS})
          </Text>
        </Pressable>
      ) : null}

      <Modal visible={picking} transparent animationType="slide" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Choose a prompt</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {available.map((p) => (
                <Pressable key={p} style={styles.option} onPress={() => addPrompt(p)}>
                  <Text style={styles.optionText}>{p}</Text>
                  <Text style={styles.optionAdd}>+</Text>
                </Pressable>
              ))}
              {available.length === 0 ? (
                <Text style={styles.empty}>You've used all available prompts.</Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) => StyleSheet.create({
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  prompt: { ...typography.body, color: c.text, fontWeight: '800', flex: 1, marginRight: spacing.sm },
  remove: { fontSize: 22, color: c.textMuted, fontWeight: '800', lineHeight: 22 },
  input: {
    marginTop: spacing.sm,
    minHeight: 56,
    textAlignVertical: 'top',
    color: c.text,
    fontSize: 15,
    lineHeight: 21
  },
  count: { ...typography.caption, color: c.textMuted, fontSize: 11, textAlign: 'right' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: c.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    backgroundColor: c.brandSoft
  },
  addPlus: { fontSize: 20, color: c.primary, fontWeight: '800', marginRight: spacing.xs },
  addLabel: { ...typography.caption, color: c.primary, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(8,16,28,0.4)', justifyContent: 'flex-end' },
  sheet: {
    // Dark keeps the original translucent glass sheet; light needs an opaque
    // card so the sheet content stays readable over the dimmed backdrop.
    backgroundColor: mode === 'dark' ? c.surface : c.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '70%'
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    marginBottom: spacing.md
  },
  sheetTitle: { ...typography.subtitle, color: c.text, fontWeight: '800', marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border
  },
  optionText: { ...typography.body, color: c.text, flex: 1, marginRight: spacing.sm },
  optionAdd: { fontSize: 20, color: c.primary, fontWeight: '800' },
  empty: { ...typography.caption, color: c.textMuted, textAlign: 'center', paddingVertical: spacing.lg }
});
