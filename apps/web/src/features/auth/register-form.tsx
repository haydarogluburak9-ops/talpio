'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@talpio/api-client';
import { Button, Field, Input } from '@talpio/ui';
import { registerSchema, suggestUsernameFromFullName, type RegisterInput } from '@talpio/validation';
import { ArrowRight } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { getLocale, t } from '@/lib/i18n';

import { PasswordInput } from './password-input';
import { useRegister } from './use-session';
import { UsernameField } from './username-field';

const inputClassName =
  'h-9 rounded-lg border-border/70 px-3 text-sm shadow-soft transition-[border-color,box-shadow] focus:border-brand-400 focus:ring-2 focus:ring-brand-200/50 dark:focus:border-brand-500 dark:focus:ring-brand-800/50';

export function RegisterForm() {
  const signUp = useRegister();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
      locale: getLocale(),
      acceptedMarketing: false,
    },
  });

  const onSubmit = handleSubmit((values) => {
    signUp.mutate({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      username: values.username,
      locale: getLocale(),
      acceptedMarketing: values.acceptedMarketing === true,
      ...(values.phone ? { phone: values.phone } : {}),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      {signUp.isError ? (
        <p role="alert" className="rounded-lg bg-danger-surface p-2.5 text-xs text-danger-on-surface">
          {signUp.error instanceof ApiError ? signUp.error.message : t('auth.networkError')}
        </p>
      ) : null}

      <section className="grid gap-2.5 sm:grid-cols-2">
        <Field label={t('auth.fullName')} required error={errors.fullName?.message} className="gap-1">
          {(props) => (
            <Input
              {...props}
              {...register('fullName')}
              autoComplete="name"
              className={inputClassName}
              onBlur={(event) => {
                void register('fullName').onBlur(event);
                if (!getValues('username')?.trim() && getValues('fullName')?.trim()) {
                  setValue('username', suggestUsernameFromFullName(getValues('fullName')), {
                    shouldValidate: true,
                  });
                }
              }}
            />
          )}
        </Field>
        <Field label={t('auth.email')} required error={errors.email?.message} className="gap-1">
          {(props) => (
            <Input
              {...props}
              {...register('email')}
              type="email"
              autoComplete="email"
              className={inputClassName}
            />
          )}
        </Field>

        <div className="sm:col-span-2">
          <Controller
            control={control}
            name="username"
            render={({ field, fieldState }) => (
              <UsernameField
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  if (!field.value?.trim()) {
                    const fullName = getValues('fullName');
                    if (fullName?.trim()) {
                      setValue('username', suggestUsernameFromFullName(fullName), { shouldValidate: true });
                    }
                  }
                }}
                error={fieldState.error?.message}
                compact
              />
            )}
          />
        </div>

        <Field
          label={t('auth.phone')}
          hint={t('auth.phoneOptionalHint')}
          error={errors.phone?.message}
          className="gap-1 sm:col-span-2"
        >
          {(props) => (
            <Input
              {...props}
              {...register('phone')}
              type="tel"
              autoComplete="tel"
              placeholder="+905321234567"
              className={inputClassName}
            />
          )}
        </Field>

        <Field label={t('auth.password')} required error={errors.password?.message} className="gap-1">
          {(props) => (
            <PasswordInput
              {...props}
              {...register('password')}
              autoComplete="new-password"
              className={inputClassName}
            />
          )}
        </Field>
        <Field
          label={t('auth.passwordConfirmation')}
          required
          error={errors.passwordConfirmation?.message}
          className="gap-1"
        >
          {(props) => (
            <PasswordInput
              {...props}
              {...register('passwordConfirmation')}
              autoComplete="new-password"
              className={inputClassName}
            />
          )}
        </Field>
      </section>

      <section className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/80 bg-surface px-3 py-2.5">
          <input
            {...register('acceptedTerms')}
            type="checkbox"
            aria-invalid={errors.acceptedTerms ? true : undefined}
            className="mt-0.5 size-4 shrink-0 accent-accent-500"
          />
          <span className="text-xs leading-snug text-foreground">{t('auth.acceptTerms')}</span>
        </label>
        {errors.acceptedTerms?.message ? (
          <p role="alert" className="text-xs font-medium text-danger-500">
            {errors.acceptedTerms.message}
          </p>
        ) : null}

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/80 bg-surface px-3 py-2.5">
          <input
            {...register('acceptedMarketing')}
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-accent-500"
          />
          <span className="text-xs leading-snug text-foreground-muted">{t('auth.acceptMarketing')}</span>
        </label>
      </section>

      <Button type="submit" variant="accent" size="md" className="h-10 w-full" disabled={signUp.isPending}>
        {signUp.isPending ? t('auth.creatingAccount') : t('auth.createAccount')}
        {signUp.isPending ? null : <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}
