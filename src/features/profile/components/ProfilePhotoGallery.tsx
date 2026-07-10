// @ts-nocheck
import { useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, Animated, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { uploadPhoto } from '../../../services/apiService';
import { useTheme, useThemedStyles } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme/themes';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;

function getPhotoScore(asset) {
  const width = asset?.width || 0;
  const height = asset?.height || 0;
  const area = width * height;
  const ratio = height ? width / height : 1;
  const portraitBonus = height >= width ? 200000 : 0;
  const ratioPenalty = Math.abs(ratio - 0.8) * 150000;

  return area + portraitBonus - ratioPenalty;
}

function PhotoTile({ photo, index, selected, isHero, uploading, onPress, onLongPress, onRemove }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
        disabled={uploading}
        style={[
          isHero ? styles.heroTile : styles.tile,
          selected ? styles.tileSelected : null
        ]}
      >
        {uploading ? (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading…</Text>
          </View>
        ) : photo ? (
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

      {/* Remove (×) badge — only on filled tiles, not while uploading. */}
      {photo && !uploading ? (
        <Pressable style={styles.removeBadge} onPress={onRemove} hitSlop={8}>
          <Text style={styles.removeBadgeText}>×</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export function ProfilePhotoGallery({ photos = [], onChange, token }) {
  const styles = useThemedStyles(makeStyles);
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
  const [uploadingIndex, setUploadingIndex] = useState(-1);

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
        // No forced crop: Android's built-in crop step was trapping users (no
        // clear "done", couldn't proceed). We use the full image and display it
        // with resizeMode="cover", so cropping isn't needed.
        allowsEditing: false
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selected = result.assets[0];
      if (!selected?.uri) {
        Alert.alert('Upload failed', 'Could not read selected image. Please try another photo.');
        return;
      }

      // Upload to the backend and store the hosted URL (not the local file:// URI,
      // which is device-only and won't be visible to other users).
      let storedUri = selected.uri;
      if (token) {
        try {
          setUploadingIndex(index);
          const { url } = await uploadPhoto(selected.uri, token);
          storedUri = url;
        } catch (uploadError) {
          Alert.alert('Upload failed', uploadError?.message || 'Could not upload image. Please try again.');
          return;
        } finally {
          setUploadingIndex(-1);
        }
      }

      const next = [...normalized];
      next[index] = storedUri;
      const cleaned = next.filter(Boolean);
      const score = getPhotoScore(selected);
      const nextScores = { ...photoScores, [storedUri]: score };
      setPhotoScores(nextScores);
      const ranked = [...cleaned].sort((a, b) => (nextScores[b] || 0) - (nextScores[a] || 0));
      onChange(ranked);

      setSelectedIndex(0);
    } catch (error) {
      setUploadingIndex(-1);
      Alert.alert('Upload failed', error?.message || 'Unable to open gallery right now.');
    }
  }

  function removePhoto(index) {
    const filledCount = normalized.filter(Boolean).length;
    if (filledCount <= MIN_PHOTOS) {
      Alert.alert(
        'Keep at least 2 photos',
        `A profile needs a minimum of ${MIN_PHOTOS} photos. Add another before removing this one.`
      );
      return;
    }

    Alert.alert('Remove photo?', 'This photo will be removed from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const next = [...normalized];
          next[index] = '';
          onChange(next.filter(Boolean));
          setSelectedIndex(0);
        }
      }
    ]);
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
  const filledCount = normalized.filter(Boolean).length;

  return (
    <View>
      <PhotoTile
        photo={heroPhoto}
        index={0}
        selected={selectedIndex === 0}
        isHero
        uploading={uploadingIndex === 0}
        onPress={() => handleTilePress(0)}
        onLongPress={() => { if (heroPhoto) setPreviewUrl(heroPhoto); }}
        onRemove={() => removePhoto(0)}
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
              uploading={uploadingIndex === realIndex}
              onPress={() => handleTilePress(realIndex)}
              onLongPress={() => { if (photo) setPreviewUrl(photo); }}
              onRemove={() => removePhoto(realIndex)}
            />
          );
        })}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.helperText}>Tap to select · long-press to preview · tap × to remove</Text>
        <View style={[styles.countPill, filledCount >= MIN_PHOTOS ? styles.countPillOk : styles.countPillWarn]}>
          <Text style={[styles.countText, filledCount >= MIN_PHOTOS ? styles.countTextOk : styles.countTextWarn]}>
            {filledCount >= MIN_PHOTOS ? '✓ ' : ''}
            {filledCount}/{MAX_PHOTOS} · min {MIN_PHOTOS}
          </Text>
        </View>
      </View>

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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  heroTileWrap: {
    marginBottom: spacing.sm
  },
  heroTile: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: c.border,
    backgroundColor: c.inputBg,
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
    borderColor: c.border,
    backgroundColor: c.inputBg,
    overflow: 'hidden'
  },
  tileSelected: {
    borderColor: c.primary,
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
    color: c.white,
    fontSize: 12,
    fontWeight: '700'
  },
  selectedOverlay: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs
  },
  selectedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: c.white
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  uploadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  uploadingText: {
    ...typography.caption,
    color: c.textMuted,
    fontSize: 11
  },
  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232,65,90,0.18)',
    borderWidth: 1.5,
    borderColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  plusText: {
    fontSize: 24,
    lineHeight: 26,
    color: c.primary,
    fontWeight: '900',
    includeFontPadding: false,
    textAlign: 'center'
  },
  slotLabel: {
    ...typography.caption,
    color: c.textMuted,
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
    color: c.textMuted,
    fontSize: 11,
    flex: 1
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm
  },
  countPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1
  },
  countPillOk: { backgroundColor: 'rgba(42,157,143,0.12)', borderColor: c.secondary },
  countPillWarn: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  countText: { fontSize: 11, fontWeight: '800' },
  countTextOk: { color: c.secondary },
  countTextWarn: { color: '#B45309' },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(8,12,24,0.72)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeBadgeText: {
    color: c.white,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: -1
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
    borderColor: c.border,
    backgroundColor: c.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 8
  },
  actionPillPressed: {
    backgroundColor: c.inputBg,
    borderColor: c.primary
  },
  actionText: {
    ...typography.caption,
    color: c.text,
    fontWeight: '700',
    fontSize: 13
  },
  clear: {
    ...typography.caption,
    color: c.primary,
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
    color: c.white,
    fontWeight: '700'
  }
});
