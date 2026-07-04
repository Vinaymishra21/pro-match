import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

type DropdownProps = {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
};

// A simple, on-brand single-select dropdown rendered as a bottom sheet.
export function Dropdown({ value, options, placeholder = 'Select…', onChange }: DropdownProps) {
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !value ? styles.placeholder : null]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const active = opt === value;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.option, active ? styles.optionActive : null]}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active ? styles.optionTextActive : null]}>{opt}</Text>
                    {active ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md
  },
  fieldText: { ...typography.body, color: c.text, fontWeight: '600' },
  placeholder: { color: c.textMuted, fontWeight: '400' },
  chevron: { color: c.textMuted, fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderColor: c.border,
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12
  },
  optionActive: { backgroundColor: c.brandSoft },
  optionText: { ...typography.body, fontFamily: fonts.sansSemiBold, color: c.text },
  optionTextActive: { color: c.primary, fontFamily: fonts.sansExtraBold },
  check: { color: c.primary, fontWeight: '900', fontSize: 16 }
});
