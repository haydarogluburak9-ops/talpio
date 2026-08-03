'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@ustapilot/api-client';
import type { CurrentUser } from '@ustapilot/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
} from '@ustapilot/ui';
import {
  updateUserProfileSchema,
  type UpdateUserProfileInput,
  type UpdateUserProfilePayload,
} from '@ustapilot/validation';
import { Controller, useForm } from 'react-hook-form';

import { t } from '@/lib/i18n';

import { AvatarField } from './avatar-field';
import { useUpdateUserProfile } from './use-profile';

export function AccountProfileForm({ user }: { user: CurrentUser }) {
  const update = useUpdateUserProfile();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    // Üçüncü tip parametresi şemanın çıkışıdır; `handleSubmit` dönüştürülmüş
    // değerleri verir ve gövde el ile çevrilmez.
  } = useForm<UpdateUserProfileInput, unknown, UpdateUserProfilePayload>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      fullName: user.fullName,
      phone: user.phone ?? '',
      avatarFileId: undefined,
      locale: user.locale,
    },
  });

  // Kayıt sonrası form sunucudan dönen değerlerle sıfırlanır; aksi halde alanlar
  // "değişmiş" sayılmaya devam eder ve bir sonraki gönderim gereksiz olurdu.
  const onSubmit = handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: (saved) =>
        reset({
          fullName: saved.fullName,
          phone: saved.phone ?? '',
          avatarFileId: undefined,
          locale: saved.locale,
        }),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.accountSection')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Controller
            control={control}
            name="avatarFileId"
            render={({ field }) => (
              <AvatarField
                currentUrl={user.avatarUrl ?? null}
                displayName={user.fullName}
                onUploaded={(fileId) => field.onChange(fileId)}
                onRemoved={() => field.onChange(null)}
                disabled={update.isPending}
              />
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('profile.fullName')} required error={errors.fullName?.message}>
              {(props) => <Input {...props} {...register('fullName')} autoComplete="name" />}
            </Field>

            <Field label={t('profile.email')} hint={t('profile.emailHint')}>
              {(props) => <Input {...props} value={user.email} readOnly disabled />}
            </Field>

            <Field
              label={t('profile.phone')}
              hint={t('profile.phoneHint')}
              error={errors.phone?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  {...register('phone')}
                  type="tel"
                  inputMode="tel"
                  placeholder="+905321234567"
                  autoComplete="tel"
                />
              )}
            </Field>

            <Field label={t('profile.locale')} error={errors.locale?.message}>
              {(props) => (
                <Select {...props} {...register('locale')}>
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </Select>
              )}
            </Field>
          </div>

          {user.phone && !user.phoneVerifiedAt ? (
            <div>
              <Badge tone="warning">{t('profile.phoneUnverified')}</Badge>
            </div>
          ) : null}

          <FormStatus error={update.isError ? update.error : null} isSuccess={update.isSuccess} />

          <Button type="submit" className="self-start" isLoading={update.isPending}>
            {t('profile.save')}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

/** Kaydetme sonucunu duyurur; hata mesajı sunucudan gelirse olduğu gibi gösterilir. */
export function FormStatus({ error, isSuccess }: { error: unknown; isSuccess: boolean }) {
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface"
      >
        {error instanceof ApiError ? error.message : t('profile.saveFailed')}
      </p>
    );
  }

  if (isSuccess) {
    return (
      <p
        role="status"
        className="rounded-[--radius-control] bg-success-surface p-3 text-sm text-success-on-surface"
      >
        {t('profile.saved')}
      </p>
    );
  }

  return null;
}
