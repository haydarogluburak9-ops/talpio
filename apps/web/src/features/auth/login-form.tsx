'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@talpio/api-client';
import { Button, Field, Input } from '@talpio/ui';
import { loginSchema, type LoginInput } from '@talpio/validation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { t } from '@/lib/i18n';

import { PasswordInput } from './password-input';
import { useLogin } from './use-session';

export function LoginForm() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate({ email: values.email, password: values.password });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {login.isError ? (
        <p role="alert" className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface">
          {login.error instanceof ApiError
            ? login.error.message
            : t('auth.networkError')}
        </p>
      ) : null}

      <Field label={t('auth.email')} required error={errors.email?.message}>
        {(props) => (
          <Input
            {...props}
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="ornek@talpio.com"
          />
        )}
      </Field>

      <Field label={t('auth.password')} required error={errors.password?.message}>
        {(props) => (
          <PasswordInput {...props} {...register('password')} autoComplete="current-password" />
        )}
      </Field>

      <Link href="/sifremi-unuttum" className="text-sm font-medium text-accent-600 hover:underline">
        {t('auth.forgotPassword')}
      </Link>

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? t('auth.signingIn') : t('auth.signIn')}
      </Button>
    </form>
  );
}
