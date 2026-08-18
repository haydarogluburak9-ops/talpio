import { FilePurpose } from '@talpio/types';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { FormField } from '@/components/form-field';
import { Text } from '@/components/text';
import { usePhotoUpload } from '@/features/files/use-upload';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { useCreatePost } from './use-social';

export function StoryComposer({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const photos = usePhotoUpload(FilePurpose.POST_MEDIA);
  const createPost = useCreatePost();
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    if (photos.fileIds.length === 0) {
      setError(t('social.storyNeedsMedia'));
      return;
    }
    setError(null);
    createPost.mutate(
      {
        type: 'IMAGE',
        mediaFileIds: photos.fileIds,
        body: caption.trim() || undefined,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <Card>
      <Text variant="bodyStrong">{t('social.addStory')}</Text>
      <Text variant="caption" tone="muted" style={styles.hint}>
        {t('social.storyHint')}
      </Text>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.preview} />
      ) : (
        <Button label={t('social.addMedia')} variant="outline" onPress={() => void pickPhoto()} />
      )}
      <FormField
        label={t('social.storyComposerPlaceholder')}
        value={caption}
        onChangeText={setCaption}
        placeholder={t('social.storyComposerPlaceholder')}
      />
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button label={t('common.cancel')} variant="ghost" onPress={onDone} />
        <Button
          label={t('social.addStory')}
          loading={createPost.isPending || photos.isUploading}
          onPress={publish}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: spacing.xs, marginBottom: spacing.sm },
  preview: { width: '100%', height: 180, borderRadius: 16, marginBottom: spacing.sm },
  error: { color: '#b42318', marginBottom: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
});
