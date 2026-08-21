import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { SOCIAL } from '@talpio/config';
import { FilePurpose } from '@talpio/types';

import { Text } from '@/components/text';
import { usePhotoUpload } from '@/features/files/use-upload';
import { useI18n } from '@/lib/i18n';
import { radius, spacing } from '@/theme/tokens';

import { useUpdateSocialProfile } from './use-social';

export function EditableProfileCover({
  coverUrl,
  disabled,
}: {
  coverUrl?: string | null;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const upload = usePhotoUpload(FilePurpose.COVER);
  const update = useUpdateSocialProfile();
  const [preview, setPreview] = useState<string | null>(null);

  const shown = preview ?? coverUrl ?? null;
  const busy = upload.isUploading || update.isPending;

  async function pick(): Promise<void> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [SOCIAL.coverAspectRatio, 1],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    setPreview(asset.uri);
    const uploaded = await upload.add([asset], 1);
    const file = uploaded.at(-1);
    if (!file) return;

    update.mutate(
      { coverFileId: file.id },
      {
        onSuccess: (profile) => setPreview(profile.coverUrl ?? file.url),
        onError: () => setPreview(null),
      },
    );
  }

  return (
    <View style={styles.coverWrap}>
      {shown ? (
        <Image source={{ uri: shown }} style={styles.coverImage} accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.coverFallback} />
      )}

      <Pressable
        onPress={() => void pick()}
        disabled={disabled || busy}
        accessibilityRole="button"
        accessibilityLabel={t('social.changeCover')}
        style={styles.coverButton}
      >
        <Ionicons name="camera-outline" size={14} color="#fff" />
        <Text variant="caption" style={styles.coverButtonText}>
          {busy ? t('upload.uploading') : t('social.changeCover')}
        </Text>
      </Pressable>
    </View>
  );
}

export function EditableProfileAvatar({
  name,
  avatarUrl,
  disabled,
}: {
  name: string;
  avatarUrl?: string | null;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const upload = usePhotoUpload(FilePurpose.AVATAR);
  const update = useUpdateSocialProfile();
  const [preview, setPreview] = useState<string | null>(null);

  const shown = preview ?? avatarUrl ?? null;
  const busy = upload.isUploading || update.isPending;

  async function pick(): Promise<void> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    setPreview(asset.uri);
    const uploaded = await upload.add([asset], 1);
    const file = uploaded.at(-1);
    if (!file) return;

    update.mutate(
      { avatarFileId: file.id },
      {
        onSuccess: (profile) => setPreview(profile.avatarUrl ?? file.url),
        onError: () => setPreview(null),
      },
    );
  }

  return (
    <View style={styles.avatarWrap}>
      {shown ? (
        <Image source={{ uri: shown }} style={styles.avatar} accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.avatarFallback}>
          <Text variant="title" style={styles.avatarLetter}>
            {name.slice(0, 1).toLocaleUpperCase()}
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => void pick()}
        disabled={disabled || busy}
        accessibilityRole="button"
        accessibilityLabel={t('social.changeProfilePhoto')}
        style={styles.avatarButton}
      >
        <Ionicons name="camera" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

const AVATAR_SIZE = 80;

const styles = StyleSheet.create({
  coverWrap: {
    width: '100%',
    aspectRatio: SOCIAL.coverAspectRatio,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverFallback: { flex: 1, backgroundColor: '#C13584' },
  coverButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.control,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  coverButtonText: { color: '#fff', fontWeight: '600' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.card,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.card,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
  },
  avatarLetter: { color: '#fff' },
  avatarButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#262626',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
