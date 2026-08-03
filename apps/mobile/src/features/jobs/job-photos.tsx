import type { JobAttachment } from '@ustapilot/types';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { radius, spacing } from '@/theme/tokens';

/** Talebe eklenen fotoğraflar. Hiç fotoğraf yoksa bölüm gösterilmez. */
export function JobPhotos({ attachments }: { attachments: JobAttachment[] }) {
  const { t } = useI18n();

  if (attachments.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="bodyStrong">{t('upload.photosLabel')}</Text>
      <View style={styles.grid}>
        {attachments.map((file) => (
          <Image key={file.id} source={{ uri: file.url }} style={styles.photo} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 96, height: 96, borderRadius: radius.control },
});
