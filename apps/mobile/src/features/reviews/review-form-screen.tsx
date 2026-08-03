import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@ustapilot/api-client';
import { REVIEW, UPLOAD } from '@ustapilot/config';
import { FilePurpose } from '@ustapilot/types';
import { createReviewSchema, type CreateReviewInput } from '@ustapilot/validation';
import type { z } from 'zod';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { usePhotoUpload } from '@/features/files/use-upload';
import { useOrder } from '@/features/orders/use-orders';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { StarRating } from './star-rating';
import { useCreateReview } from './use-reviews';

type CreateReviewPayload = z.output<typeof createReviewSchema>;

/** Formdaki beş alt puan; sıra ekranda göründüğü sıradır. */
const RATING_FIELDS = [
  'quality',
  'punctuality',
  'communication',
  'valueForMoney',
  'tidiness',
] as const;

export function ReviewFormScreen({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const order = useOrder(orderId);
  const createReview = useCreateReview();
  const photos = usePhotoUpload(FilePurpose.REVIEW_PHOTO);

  const {
    control,
    handleSubmit,
    formState: { errors },
    // Üçüncü tip parametresi şemanın çıkışıdır; `handleSubmit` varsayılanları
    // uygulanmış, dönüştürülmüş değerleri verir ve gövde el ile çevrilmez.
  } = useForm<CreateReviewInput, unknown, CreateReviewPayload>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { orderId, photoFileIds: [] },
  });

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;

    await photos.add(
      result.assets.map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
        fileName: asset.fileName ?? null,
      })),
      UPLOAD.maxReviewPhotos,
    );
  };

  const submit = handleSubmit((values) => {
    // Fotoğraf kimlikleri yükleyicinin durumundan okunur; form alanı yalnızca
    // şema doğrulaması için vardır.
    createReview.mutate(
      { ...values, photoFileIds: photos.fileIds },
      { onSuccess: () => router.back() },
    );
  });

  return (
    <Screen>
      <Card>
        <Text variant="caption" tone="muted">
          {t('order.forJob')}
        </Text>
        <Text variant="bodyStrong">{order.data?.job?.title ?? t('common.loading')}</Text>
        <Text variant="caption" tone="muted">
          {t('review.formHint')}
        </Text>
      </Card>

      {createReview.isError ? (
        <Card style={{ backgroundColor: colors.dangerSurface, borderColor: colors.danger }}>
          <Text variant="caption" tone="danger">
            {createReview.error instanceof ApiError
              ? createReview.error.message
              : t('review.submitFailed')}
          </Text>
        </Card>
      ) : null}

      <Card>
        {RATING_FIELDS.map((name) => (
          <Controller
            key={name}
            control={control}
            name={`ratings.${name}`}
            render={({ field }) => (
              <StarRating
                label={t(`review.${name}`)}
                value={field.value}
                onChange={field.onChange}
                // Puanlanmamış alanın şema hatası "sayı bekleniyordu" der; kullanıcıya
                // gösterilecek olan ne yapması gerektiğidir.
                error={errors.ratings?.[name] ? t('review.ratingRequired') : undefined}
              />
            )}
          />
        ))}
      </Card>

      <Controller
        control={control}
        name="comment"
        render={({ field }) => (
          <FormField
            label={t('review.comment')}
            value={field.value ?? ''}
            onChangeText={(text) => field.onChange(text.length === 0 ? undefined : text)}
            multiline
            numberOfLines={4}
            maxLength={REVIEW.maxCommentLength}
            placeholder={t('review.commentPlaceholder')}
            hint={t('review.commentHint')}
            error={errors.comment?.message}
            style={styles.textarea}
          />
        )}
      />

      <View style={styles.photos}>
        <Text variant="caption" tone="muted">
          {t('review.photos')}
        </Text>

        {photos.items.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.items.map((file) => (
              <Pressable
                key={file.id}
                accessibilityRole="button"
                accessibilityLabel={t('upload.remove')}
                onPress={() => photos.remove(file.id)}
              >
                <Image source={{ uri: file.url }} style={styles.photo} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {photos.hasFailure ? (
          <Text variant="caption" tone="danger">
            {t('upload.failed')}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => void pickPhotos()}
          disabled={photos.isUploading || photos.items.length >= UPLOAD.maxReviewPhotos}
          style={styles.addPhoto}
        >
          <Ionicons name="image-outline" size={20} color={colors.brand} />
          <Text variant="caption" tone="brand">
            {photos.isUploading ? t('upload.uploading') : t('upload.addPhoto')}
          </Text>
        </Pressable>
      </View>

      <Button
        label={createReview.isPending ? t('review.submitting') : t('review.submit')}
        block
        loading={createReview.isPending}
        disabled={photos.isUploading}
        onPress={() => void submit()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  photos: { gap: spacing.sm },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 80, height: 80, borderRadius: radius.control },
  addPhoto: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
});
