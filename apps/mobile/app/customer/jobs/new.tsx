import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@talpio/api-client';
import { JOB, UPLOAD, minorUnitFactor } from '@talpio/config';
import { JobSize, JobTimeSlot } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { FormField } from '@/components/form-field';
import { OptionPicker } from '@/components/option-picker';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { CategoryIcon } from '@/features/catalog/category-icon';
import { useCategories } from '@/features/catalog/use-categories';
import { useCities, useDistricts } from '@/features/catalog/use-locations';
import { useMyCurrency } from '@/features/currency/use-currency';
import { usePhotoUpload } from '@/features/files/use-upload';
import { useCreateJob } from '@/features/jobs/use-jobs';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

const STEPS = ['stepCategory', 'stepDetails', 'stepMedia', 'stepLocation', 'stepSchedule'] as const;

interface Draft {
  categoryId: string | null;
  subcategoryId: string | null;
  title: string;
  description: string;
  size: JobSize;
  budgetLira: string;
  isUrgent: boolean;
  inspectionRequired: boolean;
  cityId: string | null;
  districtId: string | null;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
  preferredSlot: JobTimeSlot;
}

const EMPTY_DRAFT: Draft = {
  categoryId: null,
  subcategoryId: null,
  title: '',
  description: '',
  size: JobSize.UNKNOWN,
  budgetLira: '',
  isUrgent: false,
  inspectionRequired: false,
  cityId: null,
  districtId: null,
  addressLine: '',
  latitude: null,
  longitude: null,
  preferredSlot: JobTimeSlot.FLEXIBLE,
};

/**
 * Hizmet talebi sihirbazı.
 *
 * Alan sınırları `@talpio/config` içindeki ortak limitlerden gelir; son
 * adımda talep `POST /jobs` ile yayınlanır. Fotoğraflar seçim anında yüklenir;
 * talebe yalnızca dosya kimlikleri eklenir.
 */
export default function NewJobScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const { t, categoryName } = useI18n();
  const currency = useMyCurrency();
  const colors = useColors();
  const router = useRouter();

  const categories = useCategories({ withSubcategories: true });
  const cities = useCities();
  const createJob = useCreateJob();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    ...EMPTY_DRAFT,
    categoryId: params.categoryId ?? null,
  });

  const districts = useDistricts(draft.cityId);
  const photos = usePhotoUpload();
  const patch = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }));

  const subcategories =
    categories.data?.find((category) => category.id === draft.categoryId)?.subcategories ?? [];

  const canContinue = [
    draft.categoryId !== null,
    draft.title.trim().length >= JOB.minTitleLength &&
      draft.description.trim().length >= JOB.minDescriptionLength,
    // Yükleme sürerken ilerlemek, henüz kimliği olmayan fotoğrafların talebe
    // eklenmeden gönderilmesine yol açardı.
    !photos.isUploading,
    draft.cityId !== null && draft.districtId !== null,
    !photos.isUploading,
  ][step];

  const isLastStep = step === STEPS.length - 1;

  const pickPhoto = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) return;

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsMultipleSelection: true });

    if (result.canceled) return;

    await photos.add(
      result.assets.map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
        fileName: asset.fileName ?? null,
      })),
    );
  };

  const fillCurrentLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return;

    const position = await Location.getCurrentPositionAsync({});
    patch({ latitude: position.coords.latitude, longitude: position.coords.longitude });
  };

  const submit = (publish: boolean) => {
    if (draft.categoryId === null || draft.cityId === null || draft.districtId === null) return;

    const budget = Number(draft.budgetLira.replace(',', '.'));
    const trimmedAddress = draft.addressLine.trim();

    createJob.mutate(
      {
        categoryId: draft.categoryId,
        ...(draft.subcategoryId ? { subcategoryId: draft.subcategoryId } : {}),
        title: draft.title.trim(),
        description: draft.description.trim(),
        size: draft.size,
        isUrgent: draft.isUrgent,
        inspectionRequired: draft.inspectionRequired,
        // Kullanıcı tam birimi girer, sözleşme alt birimi bekler.
        ...(draft.budgetLira.trim() !== '' && Number.isFinite(budget) && budget > 0
          ? { budgetMinor: Math.round(budget * minorUnitFactor(currency)) }
          : {}),
        preferredTimeSlot: draft.preferredSlot,
        attachmentFileIds: photos.fileIds,
        address: {
          cityId: draft.cityId,
          districtId: draft.districtId,
          ...(trimmedAddress.length >= 5 ? { addressLine: trimmedAddress } : {}),
          ...(draft.latitude !== null && draft.longitude !== null
            ? { location: { latitude: draft.latitude, longitude: draft.longitude } }
            : {}),
        },
        publish,
      },
      {
        onSuccess: (job) => router.replace(`/customer/jobs/${job.id}`),
      },
    );
  };

  return (
    <Screen>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepper}
      >
        {STEPS.map((key, index) => (
          <Badge
            key={key}
            tone={index === step ? 'brand' : index < step ? 'success' : 'neutral'}
            label={`${index + 1}. ${t(`job.${key}`)}`}
          />
        ))}
      </ScrollView>

      {createJob.isError ? (
        <Card style={{ backgroundColor: colors.dangerSurface, borderColor: colors.danger }}>
          <Text variant="caption" tone="danger">
            {createJob.error instanceof ApiError
              ? createJob.error.message
              : t('status.networkErrorMessage')}
          </Text>
        </Card>
      ) : null}

      {step === 0 && (
        <View style={styles.form}>
          <View style={styles.grid}>
            {(categories.data ?? []).map((category) => {
              const selected = draft.categoryId === category.id;
              return (
                <Card
                  key={category.id}
                  style={[
                    styles.gridItem,
                    selected ? { borderColor: colors.brand, borderWidth: 2 } : null,
                  ]}
                  onPress={() => patch({ categoryId: category.id, subcategoryId: null })}
                >
                  <CategoryIcon iconKey={category.iconKey} color={colors.brand} />
                  <Text variant="caption" numberOfLines={2}>
                    {categoryName(category)}
                  </Text>
                </Card>
              );
            })}
          </View>

          {subcategories.length > 0 ? (
            <OptionPicker
              label={t('job.subcategory')}
              options={subcategories.map((item) => ({ id: item.id, name: categoryName(item) }))}
              selectedId={draft.subcategoryId}
              onSelect={(subcategoryId) => patch({ subcategoryId })}
              emptyLabel={t('job.selectCategoryFirst')}
            />
          ) : null}
        </View>
      )}

      {step === 1 && (
        <View style={styles.form}>
          <FormField
            label={t('job.title')}
            value={draft.title}
            onChangeText={(title) => patch({ title })}
            maxLength={JOB.maxTitleLength}
            hint={`${draft.title.length}/${JOB.maxTitleLength}`}
          />
          <FormField
            label={t('job.description')}
            value={draft.description}
            onChangeText={(description) => patch({ description })}
            multiline
            numberOfLines={6}
            style={styles.textarea}
            maxLength={JOB.maxDescriptionLength}
            hint={`${draft.description.length}/${JOB.maxDescriptionLength}`}
          />

          <OptionPicker
            label={t('job.size')}
            options={Object.values(JobSize).map((size) => ({
              id: size,
              name: t(`jobSize.${size}`),
            }))}
            selectedId={draft.size}
            onSelect={(size) => patch({ size: size as JobSize })}
            emptyLabel=""
          />

          <FormField
            label={t('job.budget')}
            value={draft.budgetLira}
            onChangeText={(budgetLira) => patch({ budgetLira })}
            keyboardType="numeric"
            placeholder="1500"
            hint={t('common.optional')}
          />

          <ToggleRow
            label={t('job.urgent')}
            value={draft.isUrgent}
            onToggle={() => patch({ isUrgent: !draft.isUrgent })}
          />
          <ToggleRow
            label={t('job.inspectionRequired')}
            value={draft.inspectionRequired}
            onToggle={() => patch({ inspectionRequired: !draft.inspectionRequired })}
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.form}>
          <View style={styles.actionsRow}>
            <Button
              label={t('job.takePhoto')}
              variant="outline"
              size="sm"
              onPress={() => void pickPhoto('camera')}
            />
            <Button
              label={t('job.chooseFromGallery')}
              variant="outline"
              size="sm"
              onPress={() => void pickPhoto('library')}
            />
          </View>

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

          <Text variant="caption" tone="muted">
            {t('common.optional')} · {photos.items.length}/{UPLOAD.maxJobAttachments}
          </Text>
          {photos.isUploading ? (
            <Text variant="caption" tone="muted">
              {t('upload.uploading')}
            </Text>
          ) : null}
          {photos.hasFailure ? (
            <Text variant="caption" tone="danger">
              {t('upload.failed')}
            </Text>
          ) : null}
        </View>
      )}

      {step === 3 && (
        <View style={styles.form}>
          <OptionPicker
            label={t('job.city')}
            options={(cities.data ?? []).map((city) => ({ id: city.id, name: city.name }))}
            selectedId={draft.cityId}
            onSelect={(cityId) => patch({ cityId, districtId: null })}
            searchable
            searchPlaceholder={t('common.search')}
            emptyLabel={t('common.loading')}
          />

          <OptionPicker
            label={t('job.district')}
            options={(districts.data ?? []).map((district) => ({
              id: district.id,
              name: district.name,
            }))}
            selectedId={draft.districtId}
            onSelect={(districtId) => patch({ districtId })}
            searchable
            searchPlaceholder={t('common.search')}
            disabled={draft.cityId === null}
            emptyLabel={draft.cityId === null ? t('job.selectCityFirst') : t('common.loading')}
          />

          <FormField
            label={t('job.addressLine')}
            value={draft.addressLine}
            onChangeText={(addressLine) => patch({ addressLine })}
            multiline
            hint={t('job.addressHidden')}
          />

          <Button
            label={t('job.useMyLocation')}
            variant="outline"
            onPress={() => void fillCurrentLocation()}
          />
          {draft.latitude !== null && (
            <Text variant="caption" tone="muted">
              {draft.latitude.toFixed(5)}, {draft.longitude?.toFixed(5)}
            </Text>
          )}
        </View>
      )}

      {step === 4 && (
        <View style={styles.form}>
          <OptionPicker
            label={t('job.preferredTime')}
            options={Object.values(JobTimeSlot).map((slot) => ({
              id: slot,
              name: t(`jobTimeSlot.${slot}`),
            }))}
            selectedId={draft.preferredSlot}
            onSelect={(slot) => patch({ preferredSlot: slot as JobTimeSlot })}
            emptyLabel=""
          />

          <Card>
            <Text variant="bodyStrong">{draft.title}</Text>
            <Text variant="caption" tone="muted" numberOfLines={3}>
              {draft.description}
            </Text>
            <View style={styles.summaryBadges}>
              {draft.isUrgent ? <Badge tone="danger" label={t('job.urgent')} /> : null}
              {draft.budgetLira.trim() !== '' ? (
                <Badge tone="neutral" label={`${draft.budgetLira} ₺`} />
              ) : null}
              <Badge tone="neutral" label={t(`jobSize.${draft.size}`)} />
            </View>
          </Card>
        </View>
      )}

      <View style={styles.navigation}>
        {step > 0 && (
          <Button
            label={t('common.back')}
            variant="outline"
            style={styles.navButton}
            disabled={createJob.isPending}
            onPress={() => setStep(step - 1)}
          />
        )}
        <Button
          label={
            isLastStep
              ? createJob.isPending
                ? t('job.publishing')
                : t('job.publish')
              : t('common.next')
          }
          style={styles.navButton}
          loading={isLastStep && createJob.isPending}
          disabled={!canContinue}
          onPress={() => (isLastStep ? submit(true) : setStep(step + 1))}
        />
      </View>

      {isLastStep ? (
        <Button
          label={t('job.saveDraft')}
          variant="ghost"
          disabled={createJob.isPending}
          onPress={() => submit(false)}
        />
      ) : null}
    </Screen>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={styles.row}
    >
      <Ionicons
        name={value ? 'checkbox' : 'square-outline'}
        size={22}
        color={value ? colors.brand : colors.foregroundMuted}
      />
      <Text variant="body" style={styles.rowLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: { gap: spacing.sm, paddingVertical: spacing.xs },
  form: { gap: spacing.lg },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { width: '47.5%', minHeight: 96 },
  actionsRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 88, height: 88, borderRadius: radius.control },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  rowLabel: { flex: 1 },
  summaryBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  navigation: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  navButton: { flex: 1 },
});
