'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@talpio/api-client';
import { Button, Field, Input } from '@talpio/ui';
import { registerSchema, suggestUsernameFromFullName, type RegisterInput } from '@talpio/validation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { getLocale, t } from '@/lib/i18n';

import { InterestPicker } from './interest-picker';
import { useRegister } from './use-session';
import { UsernameField } from './username-field';

const inputClassName =
  'h-12 rounded-xl border-border/70 px-3.5 text-[15px] shadow-soft transition-[border-color,box-shadow] focus:border-brand-400 focus:ring-2 focus:ring-brand-200/50 dark:focus:border-brand-500 dark:focus:ring-brand-800/50';

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
      interestCategoryIds: [],
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
      interestCategoryIds: values.interestCategoryIds,
      acceptedMarketing: values.acceptedMarketing === true,
      ...(values.phone ? { phone: values.phone } : {}),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7" noValidate>
      {signUp.isError ? (
        <p role="alert" className="rounded-2xl bg-danger-surface p-3.5 text-sm text-danger-on-surface">
          {signUp.error instanceof ApiError ? signUp.error.message : t('auth.networkError')}
        </p>
      ) : null}

      <div className="flex items-start gap-3 rounded-2xl border border-brand-900/8 bg-brand-50/80 px-4 py-3.5 dark:border-white/8 dark:bg-brand-900/40">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-900 text-accent-400">
          <Sparkles className="size-4" />
        </span>
        <p className="pt-2 text-sm leading-relaxed text-brand-800 dark:text-brand-100">
          {t('auth.dualRoleHint')}
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <p className="font-display text-xs font-semibold tracking-[0.16em] text-accent-600 uppercase">
          {t('auth.registerSectionAccount')}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.fullName')} required error={errors.fullName?.message}>
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
          <Field label={t('auth.email')} required error={errors.email?.message}>
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
        </div>

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
            />
          )}
        />

        <Field label={t('auth.phone')} hint={t('auth.phoneOptionalHint')} error={errors.phone?.message}>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('auth.password')}
            required
            hint={t('auth.passwordHint')}
            error={errors.password?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className={inputClassName}
              />
            )}
          </Field>
          <Field label={t('auth.passwordConfirmation')} required error={errors.passwordConfirmation?.message}>
            {(props) => (
              <Input
                {...props}
                {...register('passwordConfirmation')}
                type="password"
                autoComplete="new-password"
                className={inputClassName}
              />
            )}
          </Field>
        </div>
      </section>

      <Controller
        control={control}
        name="interestCategoryIds"
        render={({ field }) => (
          <InterestPicker
            selected={field.value ?? []}
            onChange={field.onChange}
            error={errors.interestCategoryIds?.message}
          />
        )}
      />

      <section className="flex flex-col gap-3">
        <p className="font-display text-xs font-semibold tracking-[0.16em] text-accent-600 uppercase">
          {t('auth.registerSectionLegal')}
        </p>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 bg-surface p-4 transition hover:border-brand-300/70 dark:hover:border-brand-500">
          <input
            {...register('acceptedTerms')}
            type="checkbox"
            aria-invalid={errors.acceptedTerms ? true : undefined}
            className="mt-0.5 size-5 shrink-0 accent-accent-500"
          />
          <span className="text-sm leading-relaxed text-foreground">{t('auth.acceptTerms')}</span>
        </label>
        {errors.acceptedTerms?.message ? (
          <p role="alert" className="text-xs font-medium text-danger-500">
            {errors.acceptedTerms.message}
          </p>
        ) : null}

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 bg-surface p-4 transition hover:border-brand-300/70 dark:hover:border-brand-500">
          <input
            {...register('acceptedMarketing')}
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-accent-500"
          />
          <span className="text-sm leading-relaxed text-foreground-muted">{t('auth.acceptMarketing')}</span>
        </label>
      </section>

      <Button type="submit" variant="accent" size="lg" className="w-full shadow-raised" disabled={signUp.isPending}>
        {signUp.isPending ? t('auth.creatingAccount') : t('auth.createAccount')}
        {signUp.isPending ? null : <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}
