'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ProviderProfile } from '@talpio/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Textarea,
} from '@talpio/ui';
import {
  updateProviderProfileSchema,
  type UpdateProviderProfileInput,
  type UpdateProviderProfilePayload,
} from '@talpio/validation';
import { useForm } from 'react-hook-form';

import { t } from '@/lib/i18n';

import { FormStatus } from './account-profile-form';
import { useUpdateProviderProfile } from './use-profile';

/** Sayı alanı boş bırakıldığında "girilmedi" demektir; şema bunu `null` olarak bekler. */
function toOptionalNumber(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function ProviderProfileForm({ profile }: { profile: ProviderProfile }) {
  const update = useUpdateProviderProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProviderProfileInput, unknown, UpdateProviderProfilePayload>({
    resolver: zodResolver(updateProviderProfileSchema),
    defaultValues: {
      businessName: profile.businessName ?? '',
      about: profile.about ?? '',
      experienceYears: profile.experienceYears ?? null,
      acceptsUrgentJobs: profile.acceptsUrgentJobs,
      canIssueInvoice: profile.canIssueInvoice,
    },
  });

  // Kayıt sonrası form sunucudan dönen değerlerle sıfırlanır; aksi halde alanlar
  // "değişmiş" sayılmaya devam eder ve bir sonraki gönderim gereksiz olurdu.
  const onSubmit = handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: (saved) =>
        reset({
          businessName: saved.businessName ?? '',
          about: saved.about ?? '',
          experienceYears: saved.experienceYears ?? null,
          acceptsUrgentJobs: saved.acceptsUrgentJobs,
          canIssueInvoice: saved.canIssueInvoice,
        }),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>{t('profile.providerSection')}</CardTitle>
          <Badge tone={profile.isVerified ? 'success' : 'warning'}>
            {profile.isVerified ? t('profile.verified') : t('profile.unverified')}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <ProviderStats profile={profile} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('profile.businessName')}
              hint={t('profile.businessNameHint')}
              error={errors.businessName?.message}
            >
              {(props) => <Input {...props} {...register('businessName')} />}
            </Field>

            <Field
              label={t('profile.experienceYears')}
              error={errors.experienceYears?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  {...register('experienceYears', { setValueAs: toOptionalNumber })}
                  type="number"
                  min={0}
                  max={70}
                  inputMode="numeric"
                />
              )}
            </Field>
          </div>

          <Field label={t('profile.about')} hint={t('profile.aboutHint')} error={errors.about?.message}>
            {(props) => <Textarea {...props} {...register('about')} rows={5} />}
          </Field>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register('acceptsUrgentJobs')} className="size-4" />
              {t('profile.acceptsUrgentJobs')}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register('canIssueInvoice')} className="size-4" />
              {t('profile.canIssueInvoice')}
            </label>
          </div>

          <FormStatus error={update.isError ? update.error : null} isSuccess={update.isSuccess} />

          <Button type="submit" className="self-start" isLoading={update.isPending}>
            {t('profile.save')}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

/** Tamamlanan iş, puan ve yorum sayısı işlerden türetilir; satıcı bunları düzenleyemez. */
function ProviderStats({ profile }: { profile: ProviderProfile }) {
  const items = [
    { label: t('profile.completedJobs'), value: String(profile.completedJobCount) },
    {
      label: t('profile.rating'),
      value: profile.averageRating == null ? '—' : profile.averageRating.toFixed(1),
    },
    { label: t('profile.reviews'), value: String(profile.reviewCount) },
  ];

  return (
    <dl className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[--radius-control] bg-surface-muted p-3 text-center"
        >
          <dt className="text-xs text-foreground-muted">{item.label}</dt>
          <dd className="text-lg font-semibold text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
