// @ts-nocheck
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { PROFESSIONS } from '../constants/professions';

const AGE_MIN = 18;
const AGE_MAX = 60;
const DISTANCE_OPTIONS = ['5 km', '10 km', '25 km', '50 km', '100 km', 'Unlimited'];
const LOOKING_FOR_OPTIONS = ['Long-term relationship', 'Short-term dating', 'Life partner', 'Still figuring it out'];
const GENDER_OPTIONS = ['Men', 'Women', 'Everyone'];
const ACTIVITY_OPTIONS = ['Active today', 'Active this week', 'Everyone'];
const VERIFIED_OPTIONS = ['Verified only', 'Everyone'];

const DEFAULT_FILTERS = {
  ageRange: [22, 35],
  distance: '25 km',
  professions: [],
  lookingFor: [],
  gender: 'Everyone',
  activity: 'Everyone',
  verified: 'Everyone',
  showProfessionOnly: true
};

export { DEFAULT_FILTERS };

function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}

function ChipRow({ options, selected, onToggle, multi = false }) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const isSelected = multi
          ? Array.isArray(selected) && selected.includes(option)
          : selected === option;

        return (
          <AnimatedChip
            key={option}
            label={option}
            selected={isSelected}
            onPress={() => onToggle(option)}
          />
        );
      })}
    </View>
  );
}

function AnimatedChip({ label, selected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 300, friction: 10 }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.chip, selected ? styles.chipSelected : null]}
      >
        {selected ? <View style={styles.chipDot} /> : null}
        <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function AgeSlider({ range, onChange }) {
  const [min, max] = range;

  function adjust(index, delta) {
    const next = [...range];
    next[index] = Math.max(AGE_MIN, Math.min(AGE_MAX, next[index] + delta));
    if (next[0] > next[1]) return;
    onChange(next);
  }

  return (
    <View>
      <View style={styles.ageDisplay}>
        <Text style={styles.ageValue}>{min}</Text>
        <Text style={styles.ageDash}>-</Text>
        <Text style={styles.ageValue}>{max}</Text>
      </View>
      <View style={styles.ageControls}>
        <View style={styles.ageControl}>
          <Text style={styles.ageControlLabel}>Min age</Text>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperBtn} onPress={() => adjust(0, -1)}>
              <Text style={styles.stepperText}>-</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{min}</Text>
            <Pressable style={styles.stepperBtn} onPress={() => adjust(0, 1)}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.ageControl}>
          <Text style={styles.ageControlLabel}>Max age</Text>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperBtn} onPress={() => adjust(1, -1)}>
              <Text style={styles.stepperText}>-</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{max}</Text>
            <Pressable style={styles.stepperBtn} onPress={() => adjust(1, 1)}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function ToggleRow({ label, description, value, onToggle }) {
  return (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <View style={styles.toggleTextWrap}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDesc}>{description}</Text> : null}
      </View>
      <View style={[styles.toggleTrack, value ? styles.toggleTrackOn : null]}>
        <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : null]} />
      </View>
    </Pressable>
  );
}

export function FilterModal({ visible, onClose, filters: externalFilters, onApply }) {
  const [filters, setFilters] = useState(externalFilters || DEFAULT_FILTERS);

  function update(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMulti(key, option) {
    setFilters((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const next = current.includes(option)
        ? current.filter((i) => i !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  }

  function handleApply() {
    onApply(filters);
    onClose();
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
          <Text style={styles.modalTitle}>Filters</Text>
          <Pressable onPress={handleReset} hitSlop={12}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profession Match Toggle */}
          <ToggleRow
            label="Same profession only"
            description="Only see people in your profession"
            value={filters.showProfessionOnly}
            onToggle={() => update('showProfessionOnly', !filters.showProfessionOnly)}
          />

          <View style={styles.divider} />

          {/* Professions Filter */}
          {!filters.showProfessionOnly ? (
            <>
              <SectionHeader
                title="Professions"
                subtitle="Select professions you want to match with"
              />
              <ChipRow
                options={PROFESSIONS}
                selected={filters.professions}
                onToggle={(opt) => toggleMulti('professions', opt)}
                multi
              />
              <View style={styles.divider} />
            </>
          ) : null}

          {/* Age Range */}
          <SectionHeader title="Age range" />
          <AgeSlider
            range={filters.ageRange}
            onChange={(val) => update('ageRange', val)}
          />

          <View style={styles.divider} />

          {/* Distance */}
          <SectionHeader title="Maximum distance" />
          <ChipRow
            options={DISTANCE_OPTIONS}
            selected={filters.distance}
            onToggle={(opt) => update('distance', opt)}
          />

          <View style={styles.divider} />

          {/* I'm interested in */}
          <SectionHeader title="I'm interested in" />
          <ChipRow
            options={GENDER_OPTIONS}
            selected={filters.gender}
            onToggle={(opt) => update('gender', opt)}
          />

          <View style={styles.divider} />

          {/* Looking for */}
          <SectionHeader
            title="Looking for"
            subtitle="Match with people who want the same thing"
          />
          <ChipRow
            options={LOOKING_FOR_OPTIONS}
            selected={filters.lookingFor}
            onToggle={(opt) => toggleMulti('lookingFor', opt)}
            multi
          />

          <View style={styles.divider} />

          {/* Activity */}
          <SectionHeader title="Recently active" />
          <ChipRow
            options={ACTIVITY_OPTIONS}
            selected={filters.activity}
            onToggle={(opt) => update('activity', opt)}
          />

          <View style={styles.divider} />

          {/* Verified */}
          <SectionHeader title="Verification" />
          <ChipRow
            options={VERIFIED_OPTIONS}
            selected={filters.verified}
            onToggle={(opt) => update('verified', opt)}
          />

          <View style={styles.bottomPad} />
        </ScrollView>

        <View style={styles.applyBar}>
          <Pressable
            style={({ pressed }) => [styles.applyButton, pressed ? styles.applyButtonPressed : null]}
            onPress={handleApply}
          >
            <Text style={styles.applyText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

FilterModal.DEFAULT_FILTERS = DEFAULT_FILTERS;

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: colors.background
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  closeText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600'
  },
  modalTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '800'
  },
  resetText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700'
  },
  scrollContent: {
    padding: spacing.lg
  },
  sectionHeader: {
    marginBottom: spacing.sm
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 16
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FDEEE8'
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600'
  },
  chipLabelSelected: {
    color: colors.primary,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  ageValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text
  },
  ageDash: {
    fontSize: 24,
    color: colors.textMuted,
    marginHorizontal: spacing.sm
  },
  ageControls: {
    flexDirection: 'row',
    gap: spacing.md
  },
  ageControl: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center'
  },
  ageControlLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepperText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    minWidth: 28,
    textAlign: 'center'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md
  },
  toggleTextWrap: {
    flex: 1,
    marginRight: spacing.sm
  },
  toggleLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700'
  },
  toggleDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DCE6F2',
    padding: 3,
    justifyContent: 'center'
  },
  toggleTrackOn: {
    backgroundColor: colors.primary
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  toggleThumbOn: {
    alignSelf: 'flex-end'
  },
  bottomPad: {
    height: 100
  },
  applyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  applyButtonPressed: {
    opacity: 0.9
  },
  applyText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700'
  }
});
