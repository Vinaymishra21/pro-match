// @ts-nocheck
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { colorsDark as colors } from '../theme/colorsDark';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

import {
  genderOptions,
  languageOptions,
  lookingForOptions,
  religionOptions
} from '../features/profile/constants/profileOptions';

const AGE_MIN = 18;
const AGE_MAX = 60;
const HEIGHT_MIN = 150; // cm
const HEIGHT_MAX = 200; // cm
const DISTANCE_MIN = 5; // km
const DISTANCE_STEP = 5; // km
// Slider max doubles as the "Any distance" state — no radius filter is sent.
const DISTANCE_ANY_KM = 500;
const LOOKING_FOR_OPTIONS = lookingForOptions;
const GENDER_OPTIONS = genderOptions;

const DEFAULT_FILTERS = {
  ageRange: [22, 35],
  heightRange: [HEIGHT_MIN, HEIGHT_MAX],
  distance: DISTANCE_ANY_KM, // km; DISTANCE_ANY_KM = any distance
  lookingFor: [],
  gender: [], // multi-select; empty = everyone
  religions: [],
  languages: [],
  activity: 'Everyone',
  verifiedOnly: false
};

export { DEFAULT_FILTERS, DISTANCE_ANY_KM };

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

function RangeStepper({ range, onChange, bound, step = 1, unit = '', minLabel, maxLabel }) {
  const [min, max] = range;

  function adjust(index, delta) {
    const next = [...range];
    next[index] = Math.max(bound[0], Math.min(bound[1], next[index] + delta));
    if (next[0] > next[1]) return;
    onChange(next);
  }

  return (
    <View>
      <View style={styles.ageDisplay}>
        <Text style={styles.ageValue}>{min}{unit}</Text>
        <Text style={styles.ageDash}>-</Text>
        <Text style={styles.ageValue}>{max}{unit}</Text>
      </View>
      <View style={styles.ageControls}>
        <View style={styles.ageControl}>
          <Text style={styles.ageControlLabel}>{minLabel}</Text>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperBtn} onPress={() => adjust(0, -step)}>
              <Text style={styles.stepperText}>-</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{min}</Text>
            <Pressable style={styles.stepperBtn} onPress={() => adjust(0, step)}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.ageControl}>
          <Text style={styles.ageControlLabel}>{maxLabel}</Text>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperBtn} onPress={() => adjust(1, -step)}>
              <Text style={styles.stepperText}>-</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{max}</Text>
            <Pressable style={styles.stepperBtn} onPress={() => adjust(1, step)}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// Single-value drag slider for the distance radius. Drag anywhere on the
// track (or the thumb) — moves relative to where the value was when the
// gesture started, snapping to DISTANCE_STEP. Top end = "Any distance".
function DistanceSlider({ value, onChange }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const startValueRef = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startValueRef.current = valueRef.current;
      },
      onPanResponderMove: (_e, gesture) => {
        const width = trackWidthRef.current;
        if (!width) return;
        const raw = startValueRef.current + (gesture.dx / width) * (DISTANCE_ANY_KM - DISTANCE_MIN);
        const snapped = Math.round(raw / DISTANCE_STEP) * DISTANCE_STEP;
        const next = Math.max(DISTANCE_MIN, Math.min(DISTANCE_ANY_KM, snapped));
        if (next !== valueRef.current) onChangeRef.current(next);
      },
      // Don't let the surrounding ScrollView steal the gesture mid-drag.
      onPanResponderTerminationRequest: () => false
    })
  ).current;

  const isAny = value >= DISTANCE_ANY_KM;
  const pct = (value - DISTANCE_MIN) / (DISTANCE_ANY_KM - DISTANCE_MIN);
  const thumbLeft = trackWidth > 0 ? pct * (trackWidth - SLIDER_THUMB) : 0;

  return (
    <View>
      <View style={styles.ageDisplay}>
        <Text style={styles.ageValue}>{isAny ? 'Any distance' : `${value} km`}</Text>
      </View>
      <View
        style={styles.sliderHitArea}
        {...panResponder.panHandlers}
        onLayout={(e) => {
          trackWidthRef.current = e.nativeEvent.layout.width;
          setTrackWidth(e.nativeEvent.layout.width);
        }}
      >
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${pct * 100}%` }]} />
        </View>
        <View style={[styles.sliderThumb, { left: thumbLeft }]} />
      </View>
      <View style={styles.sliderScale}>
        <Text style={styles.sliderScaleText}>{DISTANCE_MIN} km</Text>
        <Text style={styles.sliderScaleText}>Any</Text>
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
  const [filters, setFilters] = useState(() => {
    const initial = { ...DEFAULT_FILTERS, ...(externalFilters || {}) };
    // Older saved filters stored distance as a display string ('25 km').
    if (typeof initial.distance !== 'number') initial.distance = DEFAULT_FILTERS.distance;
    return initial;
  });

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
          {/* Profession is the app's USP — chosen via the deck selector on
              Discover (with weekly limits / Pro), not a free multi-select here. */}
          <View style={styles.uspNote}>
            <Text style={styles.uspNoteIcon}>✦</Text>
            <Text style={styles.uspNoteText}>
              You're matching within your profession. Explore other professions from the deck
              selector on Discover.
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Verified only */}
          <ToggleRow
            label="Verified profiles only"
            description="Show only people who verified their profession"
            value={filters.verifiedOnly}
            onToggle={() => update('verifiedOnly', !filters.verifiedOnly)}
          />

          <View style={styles.divider} />

          {/* Distance */}
          <SectionHeader title="Maximum distance" subtitle="Only see people within this radius" />
          <DistanceSlider
            value={filters.distance}
            onChange={(val) => update('distance', val)}
          />

          <View style={styles.divider} />

          {/* Age Range */}
          <SectionHeader title="Age range" />
          <RangeStepper
            range={filters.ageRange}
            onChange={(val) => update('ageRange', val)}
            bound={[AGE_MIN, AGE_MAX]}
            minLabel="Min age"
            maxLabel="Max age"
          />

          <View style={styles.divider} />

          {/* Height Range */}
          <SectionHeader title="Height range" subtitle="In centimetres" />
          <RangeStepper
            range={filters.heightRange}
            onChange={(val) => update('heightRange', val)}
            bound={[HEIGHT_MIN, HEIGHT_MAX]}
            unit=" cm"
            minLabel="Min height"
            maxLabel="Max height"
          />

          <View style={styles.divider} />

          {/* I'm interested in */}
          <SectionHeader title="I'm interested in" subtitle="Leave empty to see everyone" />
          <ChipRow
            options={GENDER_OPTIONS}
            selected={filters.gender}
            onToggle={(opt) => toggleMulti('gender', opt)}
            multi
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

          {/* Religion */}
          <SectionHeader title="Religion" subtitle="Leave empty for any" />
          <ChipRow
            options={religionOptions}
            selected={filters.religions}
            onToggle={(opt) => toggleMulti('religions', opt)}
            multi
          />

          <View style={styles.divider} />

          {/* Languages */}
          <SectionHeader title="Languages" subtitle="Speaks at least one" />
          <ChipRow
            options={languageOptions}
            selected={filters.languages}
            onToggle={(opt) => toggleMulti('languages', opt)}
            multi
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

const SLIDER_THUMB = 26;

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
    backgroundColor: colors.card
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
  uspNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(232,65,90,0.12)',
    borderRadius: 14,
    padding: spacing.md
  },
  uspNoteIcon: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1
  },
  uspNoteText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 18
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
    backgroundColor: 'rgba(232,65,90,0.15)'
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
  sliderHitArea: {
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden'
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary
  },
  sliderThumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -SLIDER_THUMB / 2,
    width: SLIDER_THUMB,
    height: SLIDER_THUMB,
    borderRadius: SLIDER_THUMB / 2,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  sliderScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs
  },
  sliderScaleText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600'
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
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: colors.card,
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
