import React, { useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Animated, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const MAX_PHOTOS = 6;

function getPhotoScore(asset) {
  const width = asset?.width || 0;
  const height = asset?.height || 0;
  const area = width * height;
  const ratio = height ? width / height : 1;
  const portraitBonus = height >= width ? 200000 : 0;
  const ratioPenalty = Math.abs(ratio - 0.8) * 150000;

  return area + portraitBonus - ratioPenalty;
}

function PhotoTile({ photo, index, selected, isHero, onPress, onLongPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8
    }).start();
  }

  return (
    <Animated.View style={[isHero ? styles.heroTileWrap : styles.tileWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          isHero ? styles.heroTile : styles.tile,
          selected ? styles.tileSelected : null
        ]}
      >
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
            {isHero && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Main Photo</Text>
              </View>
            )}
            {selected && (
              <View style={styles.selectedOverlay}>
                <View style={styles.selectedDot} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptySlot}>
            <View style={styles.plusCircle}>
              <Text style={styles.plusText}>+</Text>
            </View>
            <Text style={styles.slotLabel}>{isHero ? 'Main Photo' : `Photo ${index + 1}`}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function ProfilePhotoGallery({ photos = [], onChange }) {
  const normalized = useMemo(() => {
    const copy = [...photos];
    while (copy.length < MAX_PHOTOS) {
      copy.push('');
    }
    return copy.slice(0, MAX_PHOTOS);
  }, [photos]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [photoScores, setPhotoScores] = useState({});

  async function pickPhoto(index) {
    try {
      setSelectedIndex(index);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo access to upload profile pictures.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 5]
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selected = result.assets[0];
      if (!selected?.uri) {
        Alert.alert('Upload failed', 'Could not read selected image. Please try another photo.');
        return;
      }

      const next = [...normalized];
      next[index] = selected.uri;
      const cleaned = next.filter(Boolean);
      const score = getPhotoScore(selected);
      const nextScores = { ...photoScores, [selected.uri]: score };
      setPhotoScores(nextScores);
      const ranked = [...cleaned].sort((a, b) => (nextScores[b] || 0) - (nextScores[a] || 0));
      onChange(ranked);

      setSelectedIndex(0);
    } catch (error) {
      Alert.alert('Upload failed', error?.message || 'Unable to open gallery right now.');
    }
  }

  function clearPhoto() {
    const next = [...normalized];
    next[selectedIndex] = '';
    onChange(next.filter(Boolean));
  }

  function moveSelected(direction) {
    const target = selectedIndex + direction;
    if (target < 0 || target >= MAX_PHOTOS) {
      return;
    }

    const next = [...normalized];
    [next[selectedIndex], next[target]] = [next[target], next[selectedIndex]];
    onChange(next.filter(Boolean));
    setSelectedIndex(target);
  }

  function handleTilePress(index) {
    if (index === selectedIndex || !normalized[index]) {
      pickPhoto(index);
      return;
    }

    setSelectedIndex(index);
  }

  const heroPhoto = normalized[0];
  const restPhotos = normalized.slice(1);

  return (
    <View>
      <PhotoTile
        photo={heroPhoto}
        index={0}
        selected={selectedIndex === 0}
        isHero
        onPress={() => handleTilePress(0)}
        onLongPress={() => { if (heroPhoto) setPreviewUrl(heroPhoto); }}
      />

      <View style={styles.grid}>
        {restPhotos.map((photo, i) => {
          const realIndex = i + 1;
          return (
            <PhotoTile
              key={`photo-slot-${realIndex + 1}`}
              photo={photo}
              index={realIndex}
              selected={realIndex === selectedIndex}
              isHero={false}
              onPress={() => handleTilePress(realIndex)}
              onLongPress={() => { if (photo) setPreviewUrl(photo); }}
            />
          );
        })}
      </View>

      <Text style={styles.helperText}>Tap to select, tap again to replace. Long-press to preview.</Text>

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionPill, pressed ? styles.actionPillPressed : null]}
          onPress={() => pickPhoto(selectedIndex)}
        >
          <Text style={styles.actionText}>{normalized[selectedIndex] ? 'Replace' : 'Add Photo'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionPill, pressed ? styles.actionPillPressed : null]}
          onPress={() => moveSelected(-1)}
        >
          <Text style={styles.actionText}>Move Left</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionPill, pressed ? styles.actionPillPressed : null]}
          onPress={() => moveSelected(1)}
        >
          <Text style={styles.actionText}>Move Right</Text>
        </Pressable>
      </View>

      {normalized[selectedIndex] ? (
        <Pressable onPress={clearPhoto}>
          <Text style={styles.clear}>Remove Photo {selectedIndex + 1}</Text>
        </Pressable>
      ) : null}

      <Modal visible={Boolean(previewUrl)} animationType="fade" transparent onRequestClose={() => setPreviewUrl('')}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalClose} onPress={() => setPreviewUrl('')}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
          {previewUrl ? <Image source={{ uri: previewUrl }} style={styles.modalImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTileWrap: {
    marginBottom: spacing.sm
  },
  heroTile: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    overflow: 'hidden'
  },
  tileWrap: {
    width: '31%',
    marginBottom: spacing.xs
  },
  tile: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    overflow: 'hidden'
  },
  tileSelected: {
    borderColor: colors.primary,
    borderWidth: 2.5
  },
  image: {
    width: '100%',
    height: '100%'
  },
  heroBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  heroBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700'
  },
  selectedOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs
  },
  selectedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8EFF8',
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  plusText: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: -1
  },
  slotLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.xs
  },
  helperText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs
  },
  actionPill: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 8
  },
  actionPillPressed: {
    backgroundColor: colors.inputBg,
    borderColor: colors.primary
  },
  actionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    fontSize: 13
  },
  clear: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg
  },
  modalImage: {
    width: '100%',
    height: '80%'
  },
  modalClose: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    marginBottom: spacing.md
  },
  modalCloseText: {
    color: colors.white,
    fontWeight: '700'
  }
});
