import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@talpio/api-client';
import { OFFER } from '@talpio/config';
import { formatMoney } from '@talpio/localization';
import { OfferPriceType } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { FormField } from '@/components/form-field';
import { OptionPicker } from '@/components/option-picker';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/state-views';
import { Text } from '@/components/text';
import { useJob } from '@/features/jobs/use-jobs';
import { useCreateOffer } from '@/features/offers/use-offers';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

const VALIDITY_CHOICES = [24, 48, OFFER.defaultValidityHours, 168] as const;

/**
 * Teklif verme formu.
 *
 * Tutar liradan kuruşa çevrilir; sınırlar `@talpio/config` içindeki ortak
 * `OFFER` limitlerinden gelir, böylece istemci ve backend aynı aralığı uygular.
 * Keşif sonrası fiyat seçildiğinde açıklama zorunludur: müşteri neyin keşfe
 * bağlı olduğunu bilmeden karar veremez.
 */
export default function CreateOfferScreen() {
  const params = useLocalSearchParams<{ jobId?: string }>();
  const { t, locale, categoryName } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const jobId = params.jobId ?? '';
  const job = useJob(jobId);
  const createOffer = useCreateOffer();

  const [amountLira, setAmountLira] = useState('');
  const [priceType, setPriceType] = useState<OfferPriceType>(OfferPriceType.FIXED);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [note, setNote] = useState('');
  const [validityHours, setValidityHours] = useState<number>(OFFER.defaultValidityHours);
  const [materialsIncluded, setMaterialsIncluded] = useState(false);

  const amountMinor = toMinor(amountLira);
  const noteRequired = priceType === OfferPriceType.AFTER_INSPECTION;

  const amountValid =
    amountMinor !== null &&
    amountMinor >= OFFER.minAmountMinor &&
    amountMinor <= OFFER.maxAmountMinor;

  const canSubmit = amountValid && (!noteRequired || note.trim().length > 0);

  if (job.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void job.refetch()}
        />
      </Screen>
    );
  }

  if (!job.data) {
    return (
      <Screen>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  const submit = () => {
    if (amountMinor === null) return;

    const duration = Number(durationMinutes);
    const trimmedNote = note.trim();

    createOffer.mutate(
      {
        jobRequestId: jobId,
        amountMinor,
        priceType,
        materialsIncluded,
        validityHours,
        ...(Number.isFinite(duration) && duration > 0
          ? { estimatedDurationMinutes: Math.round(duration) }
          : {}),
        ...(trimmedNote.length > 0 ? { note: trimmedNote } : {}),
      },
      { onSuccess: (offer) => router.replace(`/provider/offers/${offer.id}`) },
    );
  };

  return (
    <Screen>
      <Card>
        <Text variant="caption" tone="muted">
          {t('offer.forJob')}
        </Text>
        <Text variant="bodyStrong">{job.data.title}</Text>
        <Text variant="caption" tone="muted">
          {categoryName(job.data.category)} · {job.data.address.districtName},{' '}
          {job.data.address.cityName}
        </Text>
        {job.data.budget ? (
          <Badge tone="neutral" label={`${t('job.budget')}: ${formatMoney(job.data.budget, locale)}`} />
        ) : null}
      </Card>

      {createOffer.isError ? (
        <Card style={{ backgroundColor: colors.dangerSurface, borderColor: colors.danger }}>
          <Text variant="caption" tone="danger">
            {createOffer.error instanceof ApiError
              ? createOffer.error.message
              : t('status.networkErrorMessage')}
          </Text>
        </Card>
      ) : null}

      <View style={styles.form}>
        <FormField
          label={t('offer.amount')}
          value={amountLira}
          onChangeText={setAmountLira}
          keyboardType="numeric"
          placeholder="1500"
          hint={t('offer.amountHint')}
        />

        <OptionPicker
          label={t('offer.priceType')}
          options={Object.values(OfferPriceType).map((type) => ({
            id: type,
            name: t(`offerPriceType.${type}`),
          }))}
          selectedId={priceType}
          onSelect={(type) => setPriceType(type as OfferPriceType)}
          emptyLabel=""
        />

        <FormField
          label={t('offer.durationMinutes')}
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="numeric"
          placeholder="120"
          hint={t('common.optional')}
        />

        <OptionPicker
          label={t('offer.validityHours')}
          options={VALIDITY_CHOICES.map((hours) => ({
            id: String(hours),
            name: `${hours} ${t('common.hours')}`,
          }))}
          selectedId={String(validityHours)}
          onSelect={(value) => setValidityHours(Number(value))}
          emptyLabel=""
        />

        <FormField
          label={t('offer.note')}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={5}
          style={styles.textarea}
          maxLength={OFFER.maxNoteLength}
          hint={noteRequired ? t('common.required') : t('common.optional')}
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: materialsIncluded }}
          accessibilityLabel={t('job.materialsIncluded')}
          onPress={() => setMaterialsIncluded((current) => !current)}
          style={styles.row}
        >
          <Ionicons
            name={materialsIncluded ? 'checkbox' : 'square-outline'}
            size={22}
            color={materialsIncluded ? colors.brand : colors.foregroundMuted}
          />
          <Text variant="body" style={styles.rowLabel}>
            {t('job.materialsIncluded')}
          </Text>
        </Pressable>
      </View>

      <Button
        label={createOffer.isPending ? t('offer.submitting') : t('offer.submit')}
        loading={createOffer.isPending}
        disabled={!canSubmit}
        onPress={submit}
      />
    </Screen>
  );
}

/** Kullanıcı lirayı girer, sözleşme kuruş bekler. */
function toMinor(lira: string): number | null {
  const trimmed = lira.trim().replace(',', '.');
  if (trimmed === '') return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;

  return Math.round(value * 100);
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  rowLabel: { flex: 1 },
});
