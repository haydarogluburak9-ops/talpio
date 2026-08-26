'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AUTH } from '@talpio/config';
import { Field, Input } from '@talpio/ui';
import { changePasswordSchema, type ChangePasswordInput } from '@talpio/validation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError, apiClient } from '@/lib/api-client';
import { t } from '@/lib/i18n';

const EMPTY_FORM: ChangePasswordInput = {
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
};

/**
 * Oturum sahibinin kendi şifresini değiştirmesi. Kural metni `AUTH` sabitinden
 * türetilir; backend DTO'su da aynı sabiti kullandığı için form ve sunucu asla
 * ayrışmaz.
 */
export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_FORM,
  });

  const change = useMutation({
    mutationFn: (values: ChangePasswordInput) =>
      // `passwordConfirmation` yalnızca istemci tarafı kontrolüdür; sunucu
      // bilinmeyen alanları reddettiği için gövdeye konmaz.
      apiClient.auth.changePassword({
        currentPassword: values.currentPassword,
        password: values.password,
      }),
    onSuccess: () => reset(EMPTY_FORM),
  });

  const onSubmit = handleSubmit((values) => change.mutate(values));

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.changePassword')}</CardTitle>
          <CardDescription>{t('admin.changePasswordHint')}</CardDescription>
        </CardHeader>

        <CardContent className="flex max-w-md flex-col gap-5">
          <Field
            label={t('admin.currentPassword')}
            required
            error={errors.currentPassword?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register('currentPassword')}
                type="password"
                autoComplete="current-password"
              />
            )}
          </Field>

          <Field
            label={t('admin.newPassword')}
            required
            hint={t('admin.passwordRules', { min: AUTH.minPasswordLength })}
            error={errors.password?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register('password')}
                type="password"
                autoComplete="new-password"
              />
            )}
          </Field>

          <Field
            label={t('admin.newPasswordConfirmation')}
            required
            error={errors.passwordConfirmation?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register('passwordConfirmation')}
                type="password"
                autoComplete="new-password"
              />
            )}
          </Field>

          {change.isError ? (
            <p
              role="alert"
              className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface"
            >
              {change.error instanceof ApiError
                ? change.error.message
                : t('admin.changePasswordError')}
            </p>
          ) : null}

          {change.isSuccess ? (
            <p
              role="status"
              className="rounded-[--radius-control] bg-success-surface p-3 text-sm text-success-on-surface"
            >
              {t('admin.changePasswordDone')}
            </p>
          ) : null}

          <Button type="submit" className="self-start" isLoading={change.isPending}>
            {change.isPending ? t('admin.changePasswordSaving') : t('admin.changePasswordSubmit')}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
