import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { promptPool } from '../constants/profileOptions';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const MAX_PROMPTS = 3;
const MAX_CHARS = 250;

// Lets users pick up to 3 prompts from a pool and answer them.
export function CustomPrompts({ value = [], onChange }) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  prompt: { ...typography.body, color: colors.text, fontWeight: '800', flex: 1, marginRight: spacing.sm },
  remove: { fontSize: 22, color: colors.textMuted, fontWeight: '800', lineHeight: 22 },
  input: {
    marginTop: spacing.sm,
    minHeight: 56,
    textAlignVertical: 'top',
    color: colors.text,
    fontSize: 15,
    lineHeight: 21
  },
  count: { ...typography.caption, color: colors.textMuted, fontSize: 11, textAlign: 'right' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    backgroundColor: '#FDEEE8'
  },
  addPlus: { fontSize: 20, color: colors.primary, fontWeight: '800', marginRight: spacing.xs },
  addLabel: { ...typography.caption, color: colors.primary, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(8,16,28,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.border,
    marginBottom: spacing.md
  },
  sheetTitle: { ...typography.subtitle, color: colors.text, fontWeight: '800', marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  optionText: { ...typography.body, color: colors.text, flex: 1, marginRight: spacing.sm },
  optionAdd: { fontSize: 20, color: colors.primary, fontWeight: '800' },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg }
});
