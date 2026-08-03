import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { FilePurpose } from '@ustapilot/types';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { usePhotoUpload } from '@/features/files/use-upload';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export interface AvatarPickerProps {
  currentUrl: string | null;
  displayName: string;
  onUploaded: (fileId: string) => void;
  onRemoved: () => void;
  disabled?: boolean;
}

/**
 * Profil görseli seçici.
 *
 * Seçilen görsel hemen yüklenir ve önizleme olarak gösterilir; kullanıcı
 * sonucu görmek için kaydete basmak zorunda kalmaz, forma yalnızca dosya
 * kimliği yazılır.
 */
export function AvatarPicker({
  currentUrl,
  displayName,
  onUploaded,
  onRemoved,
  disabled = false,
}: AvatarPickerProps) {
  const { t } = useI18n();
  const colors = useColors();
  const upload = usePhotoUpload(FilePurpose.AVATAR);
  const [isRemoved, setRemoved] = useState(false);

  const uploaded = upload.items.at(-1);
  const shown = uploaded?.url ?? (isRemoved ? null : currentUrl);

  async function pick(source: 'camera' | 'library'): Promise<void> {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) return;

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

    if (result.canceled) return;

    // Tek görsel yüklenir; sınır seçilen sayı kadar artırılır çünkü önceki
    // yükleme listede kalır ve son eleman gösterilir.
    const uploaded = await upload.add(result.assets, upload.items.length + 1);
    const latest = uploaded.at(-1);
    if (latest) {
      setRemoved(false);
      onUploaded(latest.id);
    }
  }

  function remove(): void {
    setRemoved(true);
    onRemoved();
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {shown ? (
          <Image source={{ uri: shown }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder, { backgroundColor: colors.brand }]}>
            <Text variant="title" style={{ color: colors.onBrand }}>
              {initials(displayName)}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label={t('upload.fromGallery')}
            variant="outline"
            size="sm"
            disabled={disabled || upload.isUploading}
            onPress={() => void pick('library')}
          />
          <Button
            label={t('upload.fromCamera')}
            variant="outline"
            size="sm"
            disabled={disabled || upload.isUploading}
            onPress={() => void pick('camera')}
          />
          {shown ? (
            <Button
              label={t('profile.removeAvatar')}
              variant="ghost"
              size="sm"
              disabled={disabled || upload.isUploading}
              onPress={remove}
            />
          ) : null}
        </View>
      </View>

      {upload.isUploading ? (
        <Text variant="caption" tone="muted">
          {t('upload.uploading')}
        </Text>
      ) : null}
      {upload.hasFailure ? (
        <Text variant="caption" tone="danger">
          {t('upload.failed')}
        </Text>
      ) : null}
    </View>
  );
}

/** Avatar görseli yoksa ad-soyad baş harfleri gösterilir. */
function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: radius.pill },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  actions: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
});
