import { FilePurpose } from '@talpio/types';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { useSession } from '@/features/auth/session-provider';
import { usePhotoUpload } from '@/features/files/use-upload';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { useCreatePost } from './use-social';

export function PostComposer({ onPublished }: { onPublished?: () => void }) {
  const { t } = useI18n();
  const colors = useColors();
  const { user } = useSession();
  const photos = usePhotoUpload(FilePurpose.POST_MEDIA);
  const createPost = useCreatePost();
  const [body, setBody] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials =
    (user?.fullName ?? 'T')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TP';

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    await photos.add(
      [{ uri: asset.uri, mimeType: asset.mimeType ?? null, fileName: asset.fileName ?? null }],
      1,
    );
  }

  function publish() {
    const trimmed = body.trim();
    if (!trimmed && photos.fileIds.length === 0) {
      setError(t('social.composerPlaceholder'));
      return;
    }
    setError(null);
    createPost.mutate(
      {
        body: trimmed || undefined,
        mediaFileIds: photos.fileIds.length > 0 ? photos.fileIds : undefined,
      },
      {
        onSuccess: () => {
          setBody('');
          setPreviewUri(null);
          for (const fileId of photos.fileIds) photos.remove(fileId);
          onPublished?.();
        },
      },
    );
  }

  return (
    <Card>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.brand }]}>
          <Text variant="caption" style={styles.avatarText}>
            {initials}
          </Text>
        </View>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('social.composerPrompt')}
          placeholderTextColor={colors.foregroundMuted}
          multiline
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceMuted }]}
        />
      </View>

      {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} /> : null}

      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={() => void pickPhoto()} style={styles.mediaButton}>
          <Text variant="caption" style={{ color: colors.success, fontWeight: '700' }}>
            {t('social.addMedia')}
          </Text>
        </Pressable>
        <Button
          label={createPost.isPending ? t('social.publishing') : t('social.publish')}
          loading={createPost.isPending || photos.isUploading}
          onPress={publish}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  input: {
    flex: 1,
    minHeight: 72,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  preview: { width: '100%', height: 180, borderRadius: radius.control, marginTop: spacing.sm },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  mediaButton: { paddingVertical: spacing.xs },
});
