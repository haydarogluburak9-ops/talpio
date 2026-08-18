import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { ApiError } from '@talpio/api-client';
import type { CurrentUser, ProviderProfile } from '@talpio/types';
import { isMarketplaceRole } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { FormField } from '@/components/form-field';
import { MultiOptionPicker, OptionPicker } from '@/components/option-picker';
import { Screen } from '@/components/screen';
import { ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useCategories } from '@/features/catalog/use-categories';
import { useCities, useDistricts } from '@/features/catalog/use-locations';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import { AvatarPicker } from './avatar-picker';
import {
  useMyServices,
  useProviderProfile,
  useReplaceMyServiceAreas,
  useReplaceMyServices,
  useUpdateProviderProfile,
  useUpdateUserProfile,
} from './use-profile';

export function ProfileScreen() {
  const { t } = useI18n();
  const user = useCurrentUser();

  if (user.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('profile.loadFailed')}
          onRetry={() => void user.refetch()}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  if (!user.data) {
    return (
      <Screen>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={() => void user.refetch()} refreshing={user.isRefetching}>
      <AccountSection user={user.data} />
      {isMarketplaceRole(user.data.role) ? <ProviderSections /> : null}
    </Screen>
  );
}

function AccountSection({ user }: { user: CurrentUser }) {
  const { t } = useI18n();
  const update = useUpdateUserProfile();

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [avatarFileId, setAvatarFileId] = useState<string | null | undefined>(undefined);

  function save(): void {
    update.mutate({
      fullName: fullName.trim(),
      // Boş alan "numaram yok" demektir; sunucu `null` bekler.
      phone: phone.trim() === '' ? null : phone.trim(),
      ...(avatarFileId === undefined ? {} : { avatarFileId }),
    });
  }

  return (
    <Card style={styles.section}>
      <Text variant="title">{t('profile.accountSection')}</Text>

      <AvatarPicker
        currentUrl={user.avatarUrl ?? null}
        displayName={user.fullName}
        onUploaded={setAvatarFileId}
        onRemoved={() => setAvatarFileId(null)}
        disabled={update.isPending}
      />

      <FormField
        label={t('profile.fullName')}
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        maxLength={120}
      />

      <FormField
        label={t('profile.email')}
        value={user.email}
        editable={false}
        hint={t('profile.emailHint')}
      />

      <FormField
        label={t('profile.phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="+905321234567"
        hint={t('profile.phoneHint')}
      />

      {user.phone && !user.phoneVerifiedAt ? (
        <View style={styles.badgeRow}>
          <Badge tone="warning" label={t('profile.phoneUnverified')} />
        </View>
      ) : null}

      <SaveStatus error={update.isError ? update.error : null} isSuccess={update.isSuccess} />

      <Button
        label={t('profile.save')}
        block
        loading={update.isPending}
        disabled={fullName.trim().length < 2}
        onPress={save}
      />
    </Card>
  );
}

/** Satıcı bölümleri ayrı bileşende: müşteri hesabında bu sorgular hiç açılmaz. */
function ProviderSections() {
  const { t } = useI18n();
  const profile = useProviderProfile();
  const services = useMyServices();

  if (profile.isError) {
    return (
      <ErrorState
        title={t('profile.loadFailed')}
        onRetry={() => void profile.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  if (!profile.data || !services.data) return <ListSkeleton rows={3} />;

  return (
    <>
      <ProviderSection profile={profile.data} />
      <ServicesSection
        selection={
          new Map(
            services.data.map((service) => [
              service.categoryId,
              minorToLira(service.startingPriceMinor),
            ]),
          )
        }
      />
      <AreasSection areas={profile.data.serviceAreas} />
    </>
  );
}

function ProviderSection({ profile }: { profile: ProviderProfile }) {
  const { t } = useI18n();
  const update = useUpdateProviderProfile();

  const [businessName, setBusinessName] = useState(profile.businessName ?? '');
  const [about, setAbout] = useState(profile.about ?? '');
  const [experience, setExperience] = useState(
    profile.experienceYears === null || profile.experienceYears === undefined
      ? ''
      : String(profile.experienceYears),
  );
  const [acceptsUrgentJobs, setAcceptsUrgentJobs] = useState(profile.acceptsUrgentJobs);
  const [canIssueInvoice, setCanIssueInvoice] = useState(profile.canIssueInvoice);

  function save(): void {
    update.mutate({
      businessName: businessName.trim() === '' ? null : businessName.trim(),
      about: about.trim() === '' ? null : about.trim(),
      experienceYears: experience.trim() === '' ? null : Number(experience),
      acceptsUrgentJobs,
      canIssueInvoice,
    });
  }

  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="title" style={styles.sectionTitle}>
          {t('profile.providerSection')}
        </Text>
        <Badge
          tone={profile.isVerified ? 'success' : 'warning'}
          label={profile.isVerified ? t('profile.verified') : t('profile.unverified')}
        />
      </View>

      <ProviderStats profile={profile} />

      <FormField
        label={t('profile.businessName')}
        value={businessName}
        onChangeText={setBusinessName}
        hint={t('profile.businessNameHint')}
        maxLength={160}
      />

      <FormField
        label={t('profile.about')}
        value={about}
        onChangeText={setAbout}
        multiline
        numberOfLines={5}
        style={styles.textarea}
        hint={t('profile.aboutHint')}
        maxLength={2000}
      />

      <FormField
        label={t('profile.experienceYears')}
        value={experience}
        onChangeText={setExperience}
        keyboardType="number-pad"
      />

      <ToggleRow
        label={t('profile.acceptsUrgentJobs')}
        value={acceptsUrgentJobs}
        onChange={setAcceptsUrgentJobs}
      />
      <ToggleRow
        label={t('profile.canIssueInvoice')}
        value={canIssueInvoice}
        onChange={setCanIssueInvoice}
      />

      <SaveStatus error={update.isError ? update.error : null} isSuccess={update.isSuccess} />

      <Button label={t('profile.save')} block loading={update.isPending} onPress={save} />
    </Card>
  );
}

function ServicesSection({ selection }: { selection: Map<string, string> }) {
  const { t, categoryLabel } = useI18n();
  const categories = useCategories();
  const replace = useReplaceMyServices();

  const [selected, setSelected] = useState(selection);

  function toggle(categoryId: string): void {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.set(categoryId, '');
      return next;
    });
  }

  function save(): void {
    replace.mutate(
      [...selected].map(([categoryId, price]) => ({
        categoryId,
        startingPriceMinor: liraToMinor(price),
      })),
    );
  }

  return (
    <Card style={styles.section}>
      <Text variant="title">{t('profile.servicesSection')}</Text>
      <Text variant="caption" tone="muted">
        {t('profile.servicesHint')}
      </Text>

      <MultiOptionPicker
        label={t('profile.selectCategory')}
        options={(categories.data ?? []).map((category) => ({
          id: category.id,
          name: categoryLabel(category.slug, category.name),
        }))}
        selectedIds={new Set(selected.keys())}
        onToggle={(option) => toggle(option.id)}
        emptyLabel={t('common.loading')}
        renderExtra={(option) => (
          <FormField
            label={t('profile.startingPrice')}
            value={selected.get(option.id) ?? ''}
            onChangeText={(value) => setSelected((current) => new Map(current).set(option.id, value))}
            keyboardType="decimal-pad"
            placeholder="1500"
            hint={t('profile.startingPriceHint')}
          />
        )}
      />

      {selected.size === 0 ? (
        <Text variant="caption" tone="muted">
          {t('profile.servicesEmpty')}
        </Text>
      ) : null}

      <SaveStatus error={replace.isError ? replace.error : null} isSuccess={replace.isSuccess} />

      <Button
        label={t('profile.save')}
        block
        loading={replace.isPending}
        disabled={selected.size === 0}
        onPress={save}
      />
    </Card>
  );
}

/**
 * Hizmet bölgesi düzenleyici.
 *
 * Seçim birden çok şehre yayılabildiği için seçili ilçeler adlarıyla tutulur;
 * yalnızca kimlik saklansaydı başka bir şehre geçildiğinde önceki seçimler
 * adsız kalırdı.
 */
function AreasSection({ areas }: { areas: { id: string; name: string }[] }) {
  const { t } = useI18n();
  const cities = useCities();
  const replace = useReplaceMyServiceAreas();

  const [cityId, setCityId] = useState<string | null>(null);
  const [selected, setSelected] = useState(
    () => new Map(areas.map((area) => [area.id, area.name])),
  );

  const districts = useDistricts(cityId);

  function toggle(option: { id: string; name: string }): void {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(option.id)) next.delete(option.id);
      else next.set(option.id, option.name);
      return next;
    });
  }

  return (
    <Card style={styles.section}>
      <Text variant="title">{t('profile.areasSection')}</Text>
      <Text variant="caption" tone="muted">
        {t('profile.areasHint')}
      </Text>

      {selected.size > 0 ? (
        <View style={styles.chips}>
          {[...selected].map(([id, name]) => (
            <Badge key={id} tone="brand" label={name} />
          ))}
        </View>
      ) : (
        <Text variant="caption" tone="muted">
          {t('profile.areasEmpty')}
        </Text>
      )}

      <OptionPicker
        label={t('profile.selectCity')}
        options={(cities.data ?? []).map((city) => ({ id: city.id, name: city.name }))}
        selectedId={cityId}
        onSelect={setCityId}
        searchable
        searchPlaceholder={t('common.search')}
        emptyLabel={t('common.loading')}
      />

      <MultiOptionPicker
        label={t('profile.areasSection')}
        options={(districts.data ?? []).map((district) => ({
          id: district.id,
          name: district.name,
        }))}
        selectedIds={new Set(selected.keys())}
        onToggle={toggle}
        emptyLabel={cityId === null ? t('profile.selectCity') : t('common.loading')}
      />

      <SaveStatus error={replace.isError ? replace.error : null} isSuccess={replace.isSuccess} />

      <Button
        label={t('profile.save')}
        block
        loading={replace.isPending}
        disabled={selected.size === 0}
        onPress={() => replace.mutate([...selected.keys()])}
      />
    </Card>
  );
}

/** Tamamlanan iş, puan ve yorum sayısı işlerden türetilir; satıcı bunları düzenleyemez. */
function ProviderStats({ profile }: { profile: ProviderProfile }) {
  const { t } = useI18n();
  const colors = useColors();

  const items = [
    { label: t('profile.completedJobs'), value: String(profile.completedJobCount) },
    {
      label: t('profile.rating'),
      value: profile.averageRating == null ? '—' : profile.averageRating.toFixed(1),
    },
    { label: t('profile.reviews'), value: String(profile.reviewCount) },
  ];

  return (
    <View style={styles.stats}>
      {items.map((item) => (
        <View key={item.label} style={[styles.stat, { backgroundColor: colors.surfaceMuted }]}>
          <Text variant="caption" tone="muted">
            {item.label}
          </Text>
          <Text variant="bodyStrong">{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const colors = useColors();

  return (
    <View style={styles.toggleRow}>
      <Text variant="body" style={styles.toggleLabel}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.brand, false: colors.border }}
      />
    </View>
  );
}

function SaveStatus({ error, isSuccess }: { error: unknown; isSuccess: boolean }) {
  const { t } = useI18n();

  if (error) {
    return (
      <Text variant="caption" tone="danger">
        {error instanceof ApiError ? error.message : t('profile.saveFailed')}
      </Text>
    );
  }

  if (isSuccess) {
    return (
      <Text variant="caption" tone="success">
        {t('profile.saved')}
      </Text>
    );
  }

  return null;
}

/** Kullanıcı lirayı girer, sözleşme kuruş bekler. */
function liraToMinor(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function minorToLira(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value / 100);
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionTitle: { flex: 1 },
  badgeRow: { flexDirection: 'row' },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleLabel: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
